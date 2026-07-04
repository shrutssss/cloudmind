from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from .config import MODEL_NAME

def get_all_agent_findings(tool_context: ToolContext) -> dict:
    """Reads all findings from tool_context.state (keys starting with 'findings:').

    Args:
        tool_context: The ADK tool context for shared state
    """
    findings = {}
    for key, value in tool_context.state.items():
        if key.startswith("findings:"):
            findings[key] = value
    return findings

def generate_report(audience: str, tool_context: ToolContext) -> dict:
    """Collects and aggregates findings for a targeted report.

    Args:
        audience: Target audience for the report ('cfo' or 'engineering')
        tool_context: The ADK tool context for shared state
    """
    findings = get_all_agent_findings(tool_context)
    
    # Store findings under findings:report:latest as required
    report_data = {
        "report_type": audience,
        "content": f"Report generated for {audience}. Raw inputs summarized from keys: {', '.join(findings.keys())}"
    }
    tool_context.state["findings:report:latest"] = report_data
    
    return {
        "audience": audience,
        "findings": findings,
    }

INSTRUCTION = """You are the Report Agent for CloudMind.
Your job is to generate clear, audience-appropriate reports from findings
produced by other agents.
You generate two types of reports:
1. CFO REPORT (audience: "cfo"):
   - Executive summary in plain business language
   - Total dollar impact and risk level
   - Month-over-month trend
   - Top 3 action items with estimated savings
   - No technical jargon, no resource IDs
2. ENGINEERING REPORT (audience: "engineering"):
   - Detailed resource-level findings
   - Specific resource IDs and instance types
   - Step-by-step remediation actions (include gcloud commands where relevant)
   - Priority ranking (P0/P1/P2)
   - Timeline for each action
Always read findings from other agents via the shared state before generating.
Format reports in clean Markdown."""

DESCRIPTION = "Generates audience-appropriate reports. Creates executive summaries for CFOs and detailed action plans for engineering teams."

from .callbacks import before_tool_callback, after_tool_callback

report_agent = LlmAgent(
    name="report",
    model=MODEL_NAME,
    instruction=INSTRUCTION,
    description=DESCRIPTION,
    tools=[get_all_agent_findings, generate_report],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)
