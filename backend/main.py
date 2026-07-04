from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from routers import alerts, audit, chat, forecast, reports

app = FastAPI(title="CloudMind API", description="AI FinOps Agent Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
app.include_router(audit.router, prefix="/api", tags=["Audit"])


@app.get("/")
def health_check():
    return {"status": "healthy", "service": "cloudmind-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)