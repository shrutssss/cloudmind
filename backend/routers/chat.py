import json
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Non-streaming chat endpoint. Sends message to orchestrator, returns final response."""
    from agents.orchestrator import run_orchestrator

    response = await run_orchestrator(request.message, request.session_id)
    return {"response": response, "session_id": request.session_id}


@router.get("/chat/session-state")
async def chat_session_state(session_id: str):
    """Returns the current shared session state for the active chat conversation."""
    from agents.orchestrator import session_service

    session = await session_service.get_session(
        app_name="cloudmind",
        user_id="default_user",
        session_id=session_id,
    )

    if session is None:
        return {"session_id": session_id, "state": {}}

    return {"session_id": session_id, "state": dict(session.state)}


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """SSE streaming chat endpoint. Streams agent activity as events."""
    from agents.orchestrator import run_orchestrator_streaming

    async def event_generator():
        async for event in run_orchestrator_streaming(request.message, request.session_id):
            yield f"data: {json.dumps(event)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")