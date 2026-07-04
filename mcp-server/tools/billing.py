import json

from tools.db import get_db_connection


def register(mcp):
    @mcp.tool()
    def get_billing_data(project_id: str, start_date: str, end_date: str) -> dict:
        """Returns daily billing records for a project within a date range.
        Args:
            project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
        Returns a dict with 'records' (list of billing entries) and 'total_cost' (sum).
        """
        try:
            conn = get_db_connection()
            try:
                rows = conn.execute(
                    """
                    SELECT id, project_id, service, date, cost, region, tags
                    FROM billing_records
                    WHERE project_id = ? AND date >= ? AND date <= ?
                    ORDER BY date, service
                    """,
                    (project_id, start_date, end_date),
                ).fetchall()

                records = []
                total_cost = 0.0
                for row in rows:
                    record = dict(row)
                    record["tags"] = json.loads(record["tags"])
                    records.append(record)
                    total_cost += record["cost"]

                return {"records": records, "total_cost": round(total_cost, 2)}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def get_cost_by_service(project_id: str, start_date: str, end_date: str) -> dict:
        """Returns cost breakdown by GCP service for a project.
        Returns a dict with 'breakdown' (list of {service, total_cost, pct_of_total}).
        """
        try:
            conn = get_db_connection()
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
                    breakdown.append(
                        {
                            "service": row["service"],
                            "total_cost": round(service_cost, 2),
                            "pct_of_total": round(pct, 2),
                        }
                    )

                return {"breakdown": breakdown}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def get_top_spending_resources(project_id: str, limit: int = 5) -> dict:
        """Returns the top N most expensive resources in a project.
        Reads from the resources table.
        Returns a dict with 'resources' (list of {resource_id, name, type, monthly_cost}).
        """
        try:
            conn = get_db_connection()
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
                return {"resources": resources}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def compare_period_costs(
        project_id: str,
        period_a_start: str,
        period_a_end: str,
        period_b_start: str,
        period_b_end: str,
    ) -> dict:
        """Compares total costs between two time periods for a project.
        Returns a dict with 'period_a_cost', 'period_b_cost', 'difference', 'change_pct'.
        """
        try:
            conn = get_db_connection()
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

                return {
                    "period_a_cost": round(period_a_cost, 2),
                    "period_b_cost": round(period_b_cost, 2),
                    "difference": round(difference, 2),
                    "change_pct": round(change_pct, 2),
                }
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}
