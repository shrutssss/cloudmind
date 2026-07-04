from google.adk.tools import ToolContext

def store_agent_findings(tool_context: ToolContext, agent_name: str, finding_type: str, data: dict):
    """Store findings from an agent so other agents can access them."""
    key = f"findings:{agent_name}:{finding_type}"
    tool_context.state[key] = data

def get_agent_findings(tool_context: ToolContext, agent_name: str, finding_type: str) -> dict:
    """Retrieve findings from another agent."""
    key = f"findings:{agent_name}:{finding_type}"
    return tool_context.state.get(key, {})

def get_all_findings(tool_context: ToolContext) -> dict:
    """Get all stored findings from all agents."""
    findings = {}
    for key, value in tool_context.state.items():
        if key.startswith("findings:"):
            findings[key] = value
    return findings

def set_current_agent(tool_context: ToolContext, agent_name: str):
    """Set which agent is currently executing (used by callbacks)."""
    tool_context.state["current_agent_name"] = agent_name
