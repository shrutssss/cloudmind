MODEL_NAME = "gemini-2.0-flash"

PERMISSION_MATRIX = {
    "orchestrator": [
        "transfer_to_agent",
    ],
    "cost_analysis": [
        "get_billing_data",
        "get_cost_by_service",
        "get_top_spending_resources",
        "compare_period_costs",
        "get_budget_config",
        "write_audit_log",
        "transfer_to_agent",
    ],
    "anomaly_detection": [
        "get_billing_data",
        "get_cost_by_service",
        "get_budget_config",
        "get_resource_inventory",
        "get_utilization_metrics",
        "write_audit_log",
        "flag_resource_for_review",  # Can flag anomalies
        "transfer_to_agent",
    ],
    "rightsizing": [
        "get_utilization_metrics",
        "get_resource_inventory",
        "get_billing_data",
        "write_audit_log",
        "flag_resource_for_review",  # Can flag for resize
        "transfer_to_agent",
    ],
    "forecast": [
        "get_billing_data",
        "get_budget_config",
        "write_audit_log",
        "transfer_to_agent",
    ],
    "report": [
        "get_billing_data",
        "get_cost_by_service",
        "get_budget_config",
        "get_resource_inventory",
        "get_audit_logs",
        "write_audit_log",
        "transfer_to_agent",
    ],
}

def get_agent_permissions(agent_name: str) -> list[str]:
    """Retrieve allowed MCP tools for a specific agent name."""
    return PERMISSION_MATRIX.get(agent_name, [])

def is_tool_allowed(agent_name: str, tool_name: str) -> bool:
    """Check if the given tool is in the allowed list for the agent."""
    return tool_name in get_agent_permissions(agent_name)
