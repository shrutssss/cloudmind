from tools.db import get_db_connection


def register(mcp):
    @mcp.tool()
    def get_utilization_metrics(resource_id: str, weeks: int = 4) -> dict:
        """Returns CPU, memory, and network utilization for a resource over recent weeks.
        Returns a dict with 'resource_id', 'metrics' (list of weekly records), and 'averages'.
        """
        try:
            conn = get_db_connection()
            try:
                rows = conn.execute(
                    """
                    SELECT period_start, period_end, avg_cpu_pct, max_cpu_pct,
                           avg_memory_pct, max_memory_pct, avg_network_mbps
                    FROM utilization_metrics
                    WHERE resource_id = ?
                    ORDER BY period_start DESC
                    LIMIT ?
                    """,
                    (resource_id, weeks),
                ).fetchall()

                metrics = [dict(row) for row in reversed(rows)]

                if not metrics:
                    return {
                        "resource_id": resource_id,
                        "metrics": [],
                        "averages": {
                            "avg_cpu_pct": 0.0,
                            "avg_memory_pct": 0.0,
                            "avg_network_mbps": 0.0,
                        },
                    }

                count = len(metrics)
                averages = {
                    "avg_cpu_pct": round(
                        sum(m["avg_cpu_pct"] for m in metrics) / count, 2
                    ),
                    "avg_memory_pct": round(
                        sum(m["avg_memory_pct"] for m in metrics) / count, 2
                    ),
                    "avg_network_mbps": round(
                        sum(m["avg_network_mbps"] for m in metrics) / count, 2
                    ),
                }

                return {
                    "resource_id": resource_id,
                    "metrics": metrics,
                    "averages": averages,
                }
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def get_budget_config(project_id: str) -> dict:
        """Returns budget configuration and current spend for a project.
        Returns a dict with 'project_id', 'monthly_budget', 'current_month_spend',
        'budget_used_pct', 'alert_threshold_pct', 'alert_triggered'.
        """
        try:
            conn = get_db_connection()
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

                return {
                    "project_id": row["project_id"],
                    "monthly_budget": row["monthly_budget"],
                    "current_month_spend": row["current_month_spend"],
                    "budget_used_pct": row["budget_used_pct"],
                    "alert_threshold_pct": row["alert_threshold_pct"],
                    "alert_triggered": bool(row["alert_triggered"]),
                }
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}
