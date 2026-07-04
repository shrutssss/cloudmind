import os
import sqlite3
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from .config import MODEL_NAME

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")

def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_cost_breakdown(project_id: str, start_date: str, end_date: str, tool_context: ToolContext) -> dict:
    """Returns cost breakdown by service for a project within a date range.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT service, SUM(cost) AS total_cost
                FROM billing_records
                WHERE project_id = ? AND date >= ? AND date <= ?
                GROUP BY service
                ORDER BY total_cost DESC
                """,
                (project_id, start_date, end_date),
            ).fetchall()

            grand_total = sum(row["total_cost"] for row in rows)
            breakdown = []
            for row in rows:
                service_cost = row["total_cost"]
                pct = (service_cost / grand_total * 100) if grand_total else 0.0
                breakdown.append({
                    "service": row["service"],
                    "total_cost": round(service_cost, 2),
                    "pct_of_total": round(pct, 2)
                })

            result = {"breakdown": breakdown, "total_cost": round(grand_total, 2)}
            tool_context.state["findings:cost_analysis:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def get_top_spending(project_id: str, limit: int, tool_context: ToolContext) -> dict:
    """Returns the top N most expensive resources in a project.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        limit: Max number of resources to return
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT resource_id, name, type, monthly_cost
                FROM resources
                WHERE project_id = ?
                ORDER BY monthly_cost DESC
                LIMIT ?
                """,
                (project_id, limit),
            ).fetchall()

            resources = [
                {
                    "resource_id": row["resource_id"],
                    "name": row["name"],
                    "type": row["type"],
                    "monthly_cost": row["monthly_cost"],
                }
                for row in rows
            ]
            result = {"resources": resources}
            tool_context.state["findings:cost_analysis:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def compare_periods(
    project_id: str,
    period_a_start: str,
    period_a_end: str,
    period_b_start: str,
    period_b_end: str,
    tool_context: ToolContext,
) -> dict:
    """Compares total costs between two time periods for a project.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        period_a_start: Start date for period A (YYYY-MM-DD)
        period_a_end: End date for period A (YYYY-MM-DD)
        period_b_start: Start date for period B (YYYY-MM-DD)
        period_b_end: End date for period B (YYYY-MM-DD)
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            period_a_cost = conn.execute(
                """
                SELECT COALESCE(SUM(cost), 0) AS total
                FROM billing_records
                WHERE project_id = ? AND date >= ? AND date <= ?
                """,
                (project_id, period_a_start, period_a_end),
            ).fetchone()["total"]

            period_b_cost = conn.execute(
                """
                SELECT COALESCE(SUM(cost), 0) AS total
                FROM billing_records
                WHERE project_id = ? AND date >= ? AND date <= ?
                """,
                (project_id, period_b_start, period_b_end),
            ).fetchone()["total"]

            difference = period_b_cost - period_a_cost
            if period_a_cost:
                change_pct = (difference / period_a_cost) * 100
            else:
                change_pct = 0.0 if period_b_cost == 0 else 100.0

            result = {
                "period_a_cost": round(period_a_cost, 2),
                "period_b_cost": round(period_b_cost, 2),
                "difference": round(difference, 2),
                "change_pct": round(change_pct, 2),
            }
            tool_context.state["findings:cost_analysis:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def get_budget_status(project_id: str, tool_context: ToolContext) -> dict:
    """Returns the budget configuration and current spend status for a project.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            row = conn.execute(
                """
                SELECT project_id, monthly_budget, current_month_spend,
                       budget_used_pct, alert_threshold_pct, alert_triggered
                FROM budgets
                WHERE project_id = ?
                """,
                (project_id,),
            ).fetchone()

            if row is None:
                return {"error": f"No budget found for project '{project_id}'"}

            result = {
                "project_id": row["project_id"],
                "monthly_budget": row["monthly_budget"],
                "current_month_spend": row["current_month_spend"],
                "budget_used_pct": row["budget_used_pct"],
                "alert_threshold_pct": row["alert_threshold_pct"],
                "alert_triggered": bool(row["alert_triggered"]),
            }
            tool_context.state["findings:cost_analysis:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

INSTRUCTION = """You are the Cost Analysis Agent for CloudMind, a FinOps platform.
Your job is to break down cloud spending and answer questions about costs.
You have access to billing data for 3 GCP projects: proj-prod-ecommerce,
proj-staging-ml-platform, and proj-dev-internal-tools.
Data is available from January 2026 to June 2026.
When analyzing costs:
1. Always specify the exact dollar amounts
2. Calculate percentages when comparing periods
3. Identify the top spending services
4. Flag any unusual patterns you notice
Be precise with numbers. Use USD formatting ($X,XXX.XX)."""

DESCRIPTION = "Analyzes cloud costs by service, project, tag, and time period. Answers questions about where money is being spent."

from .callbacks import before_tool_callback, after_tool_callback

cost_analysis_agent = LlmAgent(
    name="cost_analysis",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
    description=DESCRIPTION,
    tools=[get_cost_breakdown, get_top_spending, compare_periods, get_budget_status],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)

