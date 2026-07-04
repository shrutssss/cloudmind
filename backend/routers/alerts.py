import os
import sqlite3

from fastapi import APIRouter

router = APIRouter()


@router.get("/alerts")
async def get_alerts():
    """Get current alerts - run anomaly detection across all projects."""
    from agents.orchestrator import run_orchestrator

    response = await run_orchestrator(
        "Check all three projects for anomalies, cost spikes, zombie resources, and budget overruns. List all findings."
    )
    return {"alerts": response}


@router.get("/alerts/quick")
async def get_quick_alerts():
    """Get budget alerts directly from database (no agent needed)."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    budgets = [dict(row) for row in conn.execute("SELECT * FROM budgets").fetchall()]
    conn.close()

    alerts = [budget for budget in budgets if budget.get("alert_triggered")]
    return {"alerts": alerts, "total": len(alerts)}