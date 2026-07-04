import os
import sqlite3

from fastapi import APIRouter

router = APIRouter()


@router.get("/audit-log")
async def get_audit_log(limit: int = 50, agent_name: str = "", severity: str = ""):
    """Get audit log entries directly from database."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    query = "SELECT * FROM audit_log WHERE 1=1"
    params = []
    if agent_name:
        query += " AND agent_name = ?"
        params.append(agent_name)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    logs = [dict(row) for row in conn.execute(query, params).fetchall()]
    conn.close()
    return {"logs": logs, "total": len(logs)}


@router.get("/dashboard/summary")
async def dashboard_summary():
    """Quick dashboard data - no agents needed, direct DB queries."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    spend_by_project = [
        dict(row)
        for row in conn.execute(
            "SELECT project_id, SUM(cost) as total_cost FROM billing_records WHERE date >= '2026-06-01' GROUP BY project_id"
        ).fetchall()
    ]

    spend_by_service = [
        dict(row)
        for row in conn.execute(
            "SELECT service, SUM(cost) as total_cost FROM billing_records WHERE date >= '2026-06-01' GROUP BY service ORDER BY total_cost DESC"
        ).fetchall()
    ]

    budgets = [dict(row) for row in conn.execute("SELECT * FROM budgets").fetchall()]

    recent_logs = [
        dict(row)
        for row in conn.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10").fetchall()
    ]

    resource_count = conn.execute("SELECT COUNT(*) as count FROM resources").fetchone()["count"]
    conn.close()

    return {
        "spend_by_project": spend_by_project,
        "spend_by_service": spend_by_service,
        "budgets": budgets,
        "recent_audit_logs": recent_logs,
        "total_resources": resource_count,
    }