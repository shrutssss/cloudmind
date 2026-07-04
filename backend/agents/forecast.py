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

def get_monthly_totals(project_id: str, tool_context: ToolContext) -> dict:
    """Returns monthly spending totals from billing data for a project.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT SUBSTR(date, 1, 7) AS month, SUM(cost) AS total_cost
                FROM billing_records
                WHERE project_id = ?
                GROUP BY month
                ORDER BY month
                """,
                (project_id,),
            ).fetchall()

            monthly_totals = [
                {"month": row["month"], "total_cost": round(row["total_cost"], 2)}
                for row in rows
            ]
            result = {"monthly_totals": monthly_totals}
            tool_context.state["findings:forecast:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def generate_forecast(project_id: str, horizon_days: int, tool_context: ToolContext) -> dict:
    """Calculates projected spend using linear trend projection.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        horizon_days: Horizon in days (e.g., 30, 60, 90)
        tool_context: The ADK tool context for shared state
    """
    try:
        totals_result = get_monthly_totals(project_id, tool_context)
        if "error" in totals_result:
            return totals_result

        monthly_totals = totals_result["monthly_totals"]
        if not monthly_totals:
            return {"error": f"No billing data found for project '{project_id}'"}

        # Extract costs
        y = [m["total_cost"] for m in monthly_totals]
        x = list(range(1, len(y) + 1))
        n = len(y)

        # Simple linear regression
        if n >= 2:
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xy = sum(xi * yi for xi, yi in zip(x, y))
            sum_x2 = sum(xi**2 for xi in x)
            denominator = (n * sum_x2 - sum_x**2)
            
            if denominator != 0:
                slope = (n * sum_xy - sum_x * sum_y) / denominator
                intercept = (sum_y - slope * sum_x) / n
            else:
                slope = 0.0
                intercept = sum_y / n
            
            # Growth rates calculation
            rates = []
            for i in range(1, n):
                if y[i-1] > 0:
                    rates.append((y[i] - y[i-1]) / y[i-1] * 100)
            growth_rate = sum(rates) / len(rates) if rates else 0.0
        else:
            slope = 0.0
            intercept = y[0] if y else 0.0
            growth_rate = 0.0

        # Project based on horizon (30 days = 1 month, 60 days = 2 months, 90 days = 3 months)
        projected_months = max(1.0, horizon_days / 30.0)
        projected_month_index = n + projected_months
        projected_spend = max(0.0, slope * projected_month_index + intercept)

        # Get budget
        conn = _get_db()
        budget = 0.0
        try:
            row = conn.execute("SELECT monthly_budget FROM budgets WHERE project_id = ?", (project_id,)).fetchone()
            if row:
                budget = row["monthly_budget"]
        finally:
            conn.close()

        budget_pct = (projected_spend / budget * 100) if budget > 0 else 0.0

        result = {
            "project_id": project_id,
            "horizon_days": horizon_days,
            "historical_months_count": n,
            "projected_spend": round(projected_spend, 2),
            "average_mom_growth_rate_pct": round(growth_rate, 2),
            "monthly_budget": budget,
            "budget_used_pct": round(budget_pct, 2),
        }
        tool_context.state["findings:forecast:latest"] = result
        return result
    except Exception as exc:
        return {"error": str(exc)}

def assess_budget_risk(project_id: str, tool_context: ToolContext) -> dict:
    """Compares forecast vs budget and returns risk level.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        tool_context: The ADK tool context for shared state
    """
    try:
        # Default forecast horizon of 30 days
        forecast_result = generate_forecast(project_id, 30, tool_context)
        if "error" in forecast_result:
            return forecast_result

        budget_pct = forecast_result["budget_used_pct"]

        if budget_pct < 70.0:
            risk_level = "LOW"
        elif budget_pct < 85.0:
            risk_level = "MEDIUM"
        elif budget_pct < 95.0:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        result = {
            "project_id": project_id,
            "projected_spend_30d": forecast_result["projected_spend"],
            "monthly_budget": forecast_result["monthly_budget"],
            "budget_used_pct": budget_pct,
            "risk_level": risk_level,
        }
        tool_context.state["findings:forecast:latest"] = result
        return result
    except Exception as exc:
        return {"error": str(exc)}

INSTRUCTION = """You are the Forecast Agent for CloudMind.
Your job is to predict future cloud spending based on historical trends.
Your forecasting method:
1. Calculate monthly totals for each available month
2. Calculate the month-over-month growth rate
3. Use linear projection for the next 30/60/90 days
4. Compare projected spend against the monthly budget
5. Flag risk level: LOW (under 70%), MEDIUM (70-85%), HIGH (85-95%), CRITICAL (>95%)
Keep it simple — linear regression or moving average is fine.
Focus on clear communication of the numbers and risk levels.
Always mention the confidence level of your forecast (low/medium/high based on data stability)."""

DESCRIPTION = "Forecasts future cloud spend based on historical trends. Predicts next 30/60/90 day costs and flags budget risks."

from .callbacks import before_tool_callback, after_tool_callback

forecast_agent = LlmAgent(
    name="forecast",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
    description=DESCRIPTION,
    tools=[get_monthly_totals, generate_forecast, assess_budget_risk],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)
