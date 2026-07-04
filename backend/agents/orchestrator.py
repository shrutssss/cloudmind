from datetime import datetime

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from .callbacks import after_tool_callback, before_tool_callback
from .config import MODEL_NAME
from .cost_analysis import cost_analysis_agent
from .anomaly_detection import anomaly_detection_agent
from .rightsizing import rightsizing_agent
from .forecast import forecast_agent
from .report import report_agent

ORCHESTRATOR_INSTRUCTION = """
You are CloudMind, an AI-powered FinOps orchestrator.
You manage a team of specialized agents to help users understand and optimize
their cloud costs across GCP projects.

YOUR AVAILABLE TEAM:
1. cost_analysis — Breaks down spending by service, project, and time period
2. anomaly_detection — Finds cost spikes, zombie resources, and budget overruns
3. rightsizing — Recommends VM downsizing based on actual utilization
4. forecast — Predicts future spending and flags budget risks
5. report — Generates CFO or Engineering reports from findings

WHEN TO DELEGATE:
- Questions about costs/spending → cost_analysis
- Questions about spikes/anomalies/unusual patterns → anomaly_detection
- Questions about optimization/savings/rightsizing → rightsizing
- Questions about future spend/budget projections → forecast
- Requests for reports/summaries → report (ALWAYS run other agents first to populate findings)

HOW TO WORK:
1. Understand the user's question
2. Decide which agents to consult (often 2-3 agents for complex questions)
3. Delegate to each relevant agent
4. Synthesize their findings into a clear, unified answer

IMPORTANT:
- For complex questions, call multiple agents in sequence
- Always start with data-gathering agents before the report agent
- Be specific with dollar amounts and percentages
- If asked for a report, first gather data from relevant agents, then call report

The GCP projects available are:
- proj-prod-ecommerce (production, highest spend)
- proj-staging-ml-platform (staging/ML workloads)
- proj-dev-internal-tools (development, lowest spend)
Data is available from January 2026 to June 2026.
"""

orchestrator_agent = LlmAgent(
    name="orchestrator",
    model=MODEL_NAME,
    instruction=ORCHESTRATOR_INSTRUCTION,
    description="Root orchestrator that delegates FinOps queries to specialized agents",
    sub_agents=[
        cost_analysis_agent,
        anomaly_detection_agent,
        rightsizing_agent,
        forecast_agent,
        report_agent,
    ],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback,
)

session_service = InMemorySessionService()


async def run_orchestrator(user_message: str, session_id: str = None) -> str:
    """Run the orchestrator with a user message and return the response."""
    runner = Runner(
        agent=orchestrator_agent,
        app_name="cloudmind",
        session_service=session_service,
    )

    if session_id is None:
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    session = await session_service.get_session(
        app_name="cloudmind",
        user_id="default_user",
        session_id=session_id,
    )
    if session is None:
        session = await session_service.create_session(
            app_name="cloudmind",
            user_id="default_user",
            session_id=session_id,
            state={"current_agent_name": "orchestrator"},
        )

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_message)],
    )

    response_text = ""
    async for event in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=content,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            response_text = event.content.parts[0].text

    return response_text


async def run_orchestrator_streaming(user_message: str, session_id: str = None):
    """Run orchestrator and yield SSE events for each agent step."""
    runner = Runner(
        agent=orchestrator_agent,
        app_name="cloudmind",
        session_service=session_service,
    )

    if session_id is None:
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    session = await session_service.get_session(
        app_name="cloudmind",
        user_id="default_user",
        session_id=session_id,
    )
    if session is None:
        session = await session_service.create_session(
            app_name="cloudmind",
            user_id="default_user",
            session_id=session_id,
            state={"current_agent_name": "orchestrator"},
        )

    yield {"type": "session", "session_id": session_id}

    content = types.Content(role="user", parts=[types.Part(text=user_message)])
    seen_agents = set()

    async for event in runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=content,
    ):
        agent_name = event.node_name if hasattr(event, "node_name") else ""
        if agent_name and agent_name not in seen_agents and agent_name != "orchestrator":
            seen_agents.add(agent_name)
            yield {
                "type": "agent_start",
                "agent": agent_name,
                "message": f"Analyzing with {agent_name}...",
            }

        if event.is_final_response() and event.content and event.content.parts:
            message = event.content.parts[0].text
            if agent_name and agent_name != "orchestrator":
                yield {
                    "type": "agent_result",
                    "agent": agent_name,
                    "message": message,
                }
            else:
                yield {
                    "type": "final_response",
                    "message": message,
                }
