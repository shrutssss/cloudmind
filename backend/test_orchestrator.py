import asyncio
import os
from dotenv import load_dotenv

# Load API key from root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from agents.orchestrator import run_orchestrator

async def main():
    # Test 1: Simple cost question
    print("=" * 60)
    print("TEST 1: Cost question")
    print("=" * 60)
    result = await run_orchestrator("What did proj-prod-ecommerce spend in June 2026?")
    print(result)
    print()

    print("Waiting 15 seconds to avoid API rate limits...")
    await asyncio.sleep(15)

    # Test 2: Anomaly detection
    print("=" * 60)
    print("TEST 2: Anomaly detection")
    print("=" * 60)
    result = await run_orchestrator("Were there any cost anomalies or spikes recently?")
    print(result)
    print()

    print("Waiting 15 seconds to avoid API rate limits...")
    await asyncio.sleep(15)

    # Test 3: Complex multi-agent question (THE DEMO QUESTION)
    print("=" * 60)
    print("TEST 3: Multi-agent question")
    print("=" * 60)
    result = await run_orchestrator(
        "Why did our production costs spike recently and what should we do about it?"
    )
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
