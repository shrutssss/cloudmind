from fastapi import APIRouter

router = APIRouter()


@router.get("/reports/generate")
async def generate_report(audience: str = "cfo", project_id: str = "proj-prod-ecommerce"):
    """Generate a CFO or Engineering report by running the full agent pipeline."""
    from agents.orchestrator import run_orchestrator

    prompt = (
        f"Generate a {audience} report for {project_id}. First analyze costs, "
        f"check for anomalies, get rightsizing recommendations, then generate the {audience} report."
    )
    response = await run_orchestrator(prompt)
    return {"report": response, "audience": audience, "project_id": project_id}


@router.get("/reports/weekly")
async def weekly_digest():
    """Generate a weekly digest across all projects."""
    from agents.orchestrator import run_orchestrator

    response = await run_orchestrator(
        "Generate a weekly digest report covering all three projects. Include cost trends, any anomalies, and top recommendations."
    )
    return {"report": response, "type": "weekly_digest"}