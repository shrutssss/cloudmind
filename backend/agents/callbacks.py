from google.adk.tools import ToolContext
from datetime import datetime, timezone
import json
import sqlite3
import os
from .config import is_tool_allowed

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")

# Map specialist tool names to their owning agent so callback permissions
# are evaluated against the delegated specialist, not the root orchestrator.
TOOL_OWNER_MAP = {
    "get_cost_breakdown": "cost_analysis",
    "get_top_spending": "cost_analysis",
    "compare_periods": "cost_analysis",
    "get_budget_status": "cost_analysis",
    "detect_cost_spikes": "anomaly_detection",
    "check_budget_alerts": "anomaly_detection",
    "identify_zombie_resources": "anomaly_detection",
    "flag_anomaly": "anomaly_detection",
    "get_resource_utilization": "rightsizing",
    "analyze_all_resources": "rightsizing",
    "calculate_savings": "rightsizing",
    "get_monthly_totals": "forecast",
    "generate_forecast": "forecast",
    "assess_budget_risk": "forecast",
    "get_all_agent_findings": "report",
    "generate_report": "report",
}

def _log_to_audit(agent_name: str, tool_name: str, status: str, details: str = ""):
    """Write directly to the audit log database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "INSERT INTO audit_log (timestamp, agent_name, action, details, status, severity, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (datetime.now(timezone.utc).isoformat(), agent_name, tool_name, details, status, "INFO", "")
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"AUDIT LOG SAVE ERROR: {e}")

async def before_tool_callback(tool, args, tool_context: ToolContext):
    """
    ADK callback that runs BEFORE every tool call.
    Enforces permission checks and logs the attempt.
    
    Returns None to allow the tool call.
    Returns a dict to BLOCK the tool call and use the dict as the result.
    """
    tool_name = tool.name
    agent_name = tool_context.state.get("current_agent_name", "unknown")

    inferred_owner = TOOL_OWNER_MAP.get(tool_name)
    if inferred_owner and agent_name != inferred_owner:
        tool_context.state["current_agent_name"] = inferred_owner
        agent_name = inferred_owner

    print(f"[CALLBACK] Agent '{agent_name}' trying to run tool '{tool_name}' with args {args}")
    if not is_tool_allowed(agent_name, tool_name):
        print(f"[CALLBACK] DENIED: '{tool_name}' is not allowed for '{agent_name}'")
        # BLOCK the tool call
        _log_to_audit(agent_name, tool_name, "DENIED", f"Permission denied for {agent_name}")
        return {
            "error": f"Permission denied: {agent_name} agent does not have access to {tool_name}",
            "status": "DENIED"
        }
    print(f"[CALLBACK] ALLOWED: '{tool_name}' is allowed for '{agent_name}'")
    # ALLOW the tool call — log it
    _log_to_audit(agent_name, tool_name, "ALLOWED", json.dumps(args) if args else "")
    return None  # None = proceed with the tool call

async def after_tool_callback(tool, args, tool_context: ToolContext, tool_response):
    """
    ADK callback that runs AFTER every tool call.
    Sanitizes responses and updates shared state with results.
    """
    agent_name = tool_context.state.get("current_agent_name", "unknown")
    
    # Store the latest result in shared state for other agents to access
    results_key = f"agent_results:{agent_name}"
    existing_results = tool_context.state.get(results_key, [])
    
    # Keep only last 5 results per agent to avoid state bloat
    existing_results.append({
        "tool": tool.name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": str(tool_response)[:500]  # Truncate large responses
    })
    tool_context.state[results_key] = existing_results[-5:]
    return tool_response
