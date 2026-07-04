import asyncio
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import ToolContext
from google.genai import types

calls = []

def dummy_tool(tool_context: ToolContext) -> str:
    """A dummy tool."""
    return "tool ran"

async def before_tool_callback(tool, args, tool_context: ToolContext):
    calls.append("before")
    return None

async def after_tool_callback(tool, args, tool_context: ToolContext, response):
    calls.append("after")
    return response

# Create sub-agent with a tool
sub = LlmAgent(
    name="sub_agent",
    model="gemini-2.0-flash",
    instruction="Always call the dummy tool and report back.",
    description="A sub agent that runs a dummy tool",
    tools=[dummy_tool]
)

# Create parent agent with sub-agent and callbacks
parent = LlmAgent(
    name="parent_agent",
    model="gemini-2.0-flash",
    instruction="Delegate to sub_agent to run the tool.",
    sub_agents=[sub],
    before_tool_callback=before_tool_callback,
    after_tool_callback=after_tool_callback
)

async def test():
    session_service = InMemorySessionService()
    runner = Runner(agent=parent, app_name="test_app", session_service=session_service)
    
    await session_service.create_session(
        app_name="test_app",
        user_id="user1",
        session_id="session1",
        state={"current_agent_name": "parent_agent"}
    )
    
    content = types.Content(role="user", parts=[types.Part(text="Run the tool")])
    async for event in runner.run_async(user_id="user1", session_id="session1", new_message=content):
        pass
    
    print("Calls registered:", calls)

if __name__ == "__main__":
    # We won't actually call Gemini to avoid api key requirements/network requests for this quick check,
    # or we can check the ADK source code to see how it executes tool callbacks.
    # Let's inspect where before_tool_callback is called in site-packages.
    pass
