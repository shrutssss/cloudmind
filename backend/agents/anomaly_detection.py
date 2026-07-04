import os
import sqlite3
import json
from datetime import datetime, timezone
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from .config import MODEL_NAME

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")

def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def detect_cost_spikes(project_id: str, threshold_pct: float, tool_context: ToolContext) -> dict:
    """Finds days where cost exceeds threshold % above the 7-day rolling average.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        threshold_pct: Percentage threshold to flag a spike (e.g., 50.0)
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT date, SUM(cost) AS daily_total
                FROM billing_records
                WHERE project_id = ?
                GROUP BY date
                ORDER BY date
                """,
                (project_id,),
            ).fetchall()

            daily_costs = [dict(row) for row in rows]
            spikes = []

            for i in range(len(daily_costs)):
                current_date = daily_costs[i]["date"]
                current_cost = daily_costs[i]["daily_total"]
                
                # Get the prior 7 days of cost
                start_idx = max(0, i - 7)
                prior_costs = [daily_costs[j]["daily_total"] for j in range(start_idx, i)]
                
                if not prior_costs:
                    continue
                
                rolling_avg = sum(prior_costs) / len(prior_costs)
                if rolling_avg > 0:
                    diff_pct = ((current_cost - rolling_avg) / rolling_avg) * 100
                    if diff_pct > threshold_pct:
                        spikes.append({
                            "date": current_date,
                            "cost": round(current_cost, 2),
                            "rolling_average": round(rolling_avg, 2),
                            "increase_pct": round(diff_pct, 2)
                        })

            result = {"spikes": spikes}
            tool_context.state["findings:anomaly_detection:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def check_budget_alerts(project_id: str, tool_context: ToolContext) -> dict:
    """Returns budget status and whether alerts are triggered for a project.

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
            tool_context.state["findings:anomaly_detection:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def identify_zombie_resources(tool_context: ToolContext) -> dict:
    """Finds resources with average CPU utilization < 5% over the last 4 weeks.

    Args:
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT r.resource_id, r.name, r.type, r.project_id, r.monthly_cost,
                       AVG(u.avg_cpu_pct) AS avg_cpu, AVG(u.avg_memory_pct) AS avg_memory
                FROM resources r
                JOIN utilization_metrics u ON r.resource_id = u.resource_id
                GROUP BY r.resource_id
                HAVING avg_cpu < 5.0
                """
            ).fetchall()

            zombies = [
                {
                    "resource_id": row["resource_id"],
                    "name": row["name"],
                    "type": row["type"],
                    "project_id": row["project_id"],
                    "monthly_cost": row["monthly_cost"],
                    "avg_cpu_pct": round(row["avg_cpu"], 2),
                    "avg_memory_pct": round(row["avg_memory"], 2),
                }
                for row in rows
            ]
            result = {"zombie_resources": zombies}
            tool_context.state["findings:anomaly_detection:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def flag_anomaly(resource_id: str, reason: str, severity: str, tool_context: ToolContext) -> dict:
    """Marks a resource anomaly in the audit log.

    Args:
        resource_id: ID of the resource exhibiting the anomaly
        reason: Explanation of the anomaly
        severity: Severity level (INFO, WARNING, HIGH, CRITICAL)
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            timestamp = datetime.now(timezone.utc).isoformat()
            details_json = json.dumps({"reason": reason})

            cursor = conn.execute(
                """
                INSERT INTO audit_log (
                    timestamp, agent_name, action, resource_id,
                    details, severity, session_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    timestamp,
                    "anomaly_detection",
                    "FLAG_ANOMALY",
                    resource_id,
                    details_json,
                    severity,
                    "",
                    "ALLOWED",
                ),
            )
            conn.commit()

            result = {"success": True, "log_id": cursor.lastrowid}
            tool_context.state["findings:anomaly_detection:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

INSTRUCTION = """You are the Anomaly Detection Agent for CloudMind.
Your job is to find unusual patterns in cloud spending and resource usage.
You look for:
1. Cost spikes — days where spending is >50% above the rolling average
2. Budget overruns — projects approaching or exceeding their budget
3. Zombie resources — VMs running with <5% CPU utilization for 2+ weeks
4. Orphaned resources — stopped VMs with attached disks still incurring costs
When you find an anomaly:
- Classify its severity: INFO, WARNING, HIGH, CRITICAL
- Estimate the financial impact
- Suggest a root cause if possible
- Flag the resource for review if severity is HIGH or CRITICAL
Always be specific about resource IDs, dates, and dollar amounts."""

DESCRIPTION = "Detects cost anomalies, spending spikes, budget overruns, and zombie resources. Alerts on unusual patterns."

from .callbacks import before_tool_callback, after_tool_callback

anomaly_detection_agent = LlmAgent(
    name="anomaly_detection",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
    description=DESCRIPTION,
    tools=[detect_cost_spikes, check_budget_alerts, identify_zombie_resources, flag_anomaly],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)

