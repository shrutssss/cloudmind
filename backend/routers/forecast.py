from fastapi import APIRouter

router = APIRouter()


@router.get("/forecast/{project_id}")
async def get_forecast(project_id: str, horizon_days: int = 30):
    """Get spending forecast for a project."""
    from agents.orchestrator import run_orchestrator

    response = await run_orchestrator(
        f"Generate a {horizon_days}-day spending forecast for {project_id}. Include budget risk assessment."
    )
    return {"forecast": response, "project_id": project_id, "horizon_days": horizon_days}