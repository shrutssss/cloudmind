import os
import sqlite3
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from .config import MODEL_NAME

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")

TIERS = [
    "e2-micro",
    "e2-small",
    "e2-medium",
    "n2-standard-2",
    "n2-standard-4",
    "n2-standard-8",
    "n2-standard-16",
    "n2-standard-32",
]

TIER_COSTS = {
    "e2-micro": 7.0,
    "e2-small": 14.0,
    "e2-medium": 27.0,
    "n2-standard-2": 49.0,
    "n2-standard-4": 97.0,
    "n2-standard-8": 194.0,
    "n2-standard-16": 388.0,
    "n2-standard-32": 776.0,
}

def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_resource_utilization(resource_id: str, tool_context: ToolContext) -> dict:
    """Gets resource details and average utilization metrics.

    Args:
        resource_id: ID of the resource
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            row = conn.execute(
                """
                SELECT r.resource_id, r.project_id, r.name, r.type, r.monthly_cost,
                       AVG(u.avg_cpu_pct) AS avg_cpu, AVG(u.avg_memory_pct) AS avg_memory
                FROM resources r
                LEFT JOIN utilization_metrics u ON r.resource_id = u.resource_id
                WHERE r.resource_id = ?
                GROUP BY r.resource_id
                """,
                (resource_id,),
            ).fetchone()

            if row is None:
                return {"error": f"Resource '{resource_id}' not found"}

            result = {
                "resource_id": row["resource_id"],
                "project_id": row["project_id"],
                "name": row["name"],
                "type": row["type"],
                "monthly_cost": row["monthly_cost"],
                "avg_cpu_pct": round(row["avg_cpu"], 2) if row["avg_cpu"] is not None else None,
                "avg_memory_pct": round(row["avg_memory"], 2) if row["avg_memory"] is not None else None,
            }
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

def calculate_savings(current_type: str, recommended_type: str, tool_context: ToolContext) -> dict:
    """Calculates monthly savings when changing resource tiers.

    Args:
        current_type: Current GCP machine type (e.g., 'n2-standard-4')
        recommended_type: Recommended GCP machine type (e.g., 'n2-standard-2')
        tool_context: The ADK tool context for shared state
    """
    current_cost = TIER_COSTS.get(current_type, 0.0)
    recommended_cost = TIER_COSTS.get(recommended_type, 0.0)
    savings = max(0.0, current_cost - recommended_cost)
    return {
        "current_type": current_type,
        "current_cost": current_cost,
        "recommended_type": recommended_type,
        "recommended_cost": recommended_cost,
        "monthly_savings": round(savings, 2),
    }

def analyze_all_resources(project_id: str, tool_context: ToolContext) -> dict:
    """Analyzes utilization for all resources in a project and returns rightsizing recommendations.

    Args:
        project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
        tool_context: The ADK tool context for shared state
    """
    try:
        conn = _get_db()
        try:
            rows = conn.execute(
                """
                SELECT r.resource_id, r.project_id, r.name, r.type, r.monthly_cost,
                       AVG(u.avg_cpu_pct) AS avg_cpu, AVG(u.avg_memory_pct) AS avg_memory
                FROM resources r
                LEFT JOIN utilization_metrics u ON r.resource_id = u.resource_id
                WHERE r.project_id = ?
                GROUP BY r.resource_id
                """,
                (project_id,),
            ).fetchall()

            recommendations = []
            total_savings = 0.0

            for row in rows:
                resource_type = row["type"]
                avg_cpu = row["avg_cpu"]
                avg_memory = row["avg_memory"]

                if avg_cpu is None or avg_memory is None:
                    continue

                # Apply rightsizing logic
                rec_type = resource_type
                if resource_type in TIERS:
                    current_idx = TIERS.index(resource_type)
                    if avg_cpu < 20.0 and avg_memory < 30.0:
                        rec_idx = max(0, current_idx - 2)
                        rec_type = TIERS[rec_idx]
                    elif avg_cpu < 40.0 and avg_memory < 50.0:
                        rec_idx = max(0, current_idx - 1)
                        rec_type = TIERS[rec_idx]
                    elif avg_cpu > 80.0 or avg_memory > 85.0:
                        rec_idx = min(len(TIERS) - 1, current_idx + 1)
                        rec_type = TIERS[rec_idx]

                savings_info = calculate_savings(resource_type, rec_type, tool_context)
                
                status = "right-sized"
                if rec_type != resource_type:
                    status = "over-provisioned" if savings_info["monthly_savings"] > 0 else "under-provisioned"

                rec = {
                    "resource_id": row["resource_id"],
                    "name": row["name"],
                    "current_type": resource_type,
                    "recommended_type": rec_type,
                    "avg_cpu_pct": round(avg_cpu, 2),
                    "avg_memory_pct": round(avg_memory, 2),
                    "status": status,
                    "monthly_savings": savings_info["monthly_savings"],
                }
                recommendations.append(rec)
                total_savings += savings_info["monthly_savings"]

            result = {
                "recommendations": recommendations,
                "total_savings": round(total_savings, 2),
            }
            tool_context.state["findings:rightsizing:latest"] = result
            return result
        finally:
            conn.close()
    except Exception as exc:
        return {"error": str(exc)}

INSTRUCTION = """You are the RightSizing Agent for CloudMind.
Your job is to compare actual resource utilization against provisioned capacity
and recommend downsizing to save money.
Rightsizing rules:
- If avg CPU < 20% AND avg memory < 30%: recommend downgrade by 2 tiers
- If avg CPU < 40% AND avg memory < 50%: recommend downgrade by 1 tier
- If avg CPU > 80% OR avg memory > 85%: recommend upgrade by 1 tier
- Otherwise: resource is right-sized
GCP machine type tiers (smallest to largest):
e2-micro, e2-small, e2-medium, n2-standard-2, n2-standard-4, n2-standard-8, n2-standard-16, n2-standard-32
Approximate monthly costs:
e2-micro: $7, e2-small: $14, e2-medium: $27, n2-standard-2: $49, n2-standard-4: $97, n2-standard-8: $194, n2-standard-16: $388, n2-standard-32: $776
When recommending:
1. State the current type and its cost
2. State the recommended type and its cost
3. Calculate monthly savings per resource
4. Sum up total monthly savings
Always be specific with numbers."""

DESCRIPTION = "Analyzes resource utilization and recommends rightsizing VMs to save money. Compares actual usage vs provisioned capacity."

from .callbacks import before_tool_callback, after_tool_callback

rightsizing_agent = LlmAgent(
    name="rightsizing",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
    description=DESCRIPTION,
    tools=[get_resource_utilization, analyze_all_resources, calculate_savings],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)
