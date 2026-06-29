# CloudMind: Complete Build Guide
## End-to-End Execution Plan with AI Prompts

> **Deadline:** July 6, 2026 at 11:59 PM PT
> **Track:** Agents for Business
> **Platform:** Kaggle AI Agents Intensive Vibe Coding Capstone

---

## TABLE OF CONTENTS

1. [Before You Start — Read This First](#phase-0)
2. [Phase 1 — Environment & Repo Setup](#phase-1)
3. [Phase 2 — Mock Data Generation](#phase-2)
4. [Phase 3 — MCP Server](#phase-3)
5. [Phase 4 — Agent Security & Base Layer](#phase-4)
6. [Phase 5 — Specialized Agents](#phase-5)
7. [Phase 6 — Orchestrator Agent](#phase-6)
8. [Phase 7 — FastAPI Backend](#phase-7)
9. [Phase 8 — Frontend Core](#phase-8)
10. [Phase 9 — Frontend Polish & Integration](#phase-9)
11. [Phase 10 — Video, Writeup & Submission](#phase-10)
12. [Master Reference — Data Contracts](#reference)

---

<a id="phase-0"></a>
## 📋 BEFORE YOU START — READ THIS FIRST

### What You're Building
CloudMind is a **multi-agent AI platform** that acts as an autonomous FinOps team. It has:
- **5 specialized AI agents** (Cost Analysis, Anomaly Detection, RightSizing, Forecast, Report)
- **1 orchestrator agent** that delegates work to the specialists
- **A custom MCP server** that provides cloud billing data as tools
- **A FastAPI backend** that connects agents to the frontend
- **A Next.js frontend** with dashboard, chat, reports, alerts, forecast, and audit log

### The 4 Things You Must Submit on Kaggle
1. ✅ **Kaggle Writeup** — description of your project
2. ✅ **Public GitHub Repo** — your code with README
3. ✅ **Video Demo** — uploaded to YouTube (unlisted is fine)
4. ✅ **Project Link** — link to your running project or repo

### The 4 Judging Criteria
| Criterion | What It Means | How We Score |
|---|---|---|
| **Innovation** | Originality of your idea | Natural-language FinOps for non-technical users + what-if scenarios |
| **Solution Design** | Architecture + 3+ ADK concepts demonstrated | 6 concepts: multi-agent, MCP, skills, callbacks/guardrails, security, shared state |
| **Communication** | Writeup quality, video quality, README | Scripted demo, clear README, polished writeup |
| **Course Concepts** | How well you apply ADK/MCP/vibe coding | Native sub_agents, ToolContext.state, before_tool_callback |

### Tech Stack (Final)
| Layer | Technology |
|---|---|
| Agent Framework | Google ADK (Python) |
| LLM | `gemini-2.5-flash` |
| MCP Server | fastmcp (Python) |
| Backend | FastAPI |
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Database | SQLite |
| Charts | Recharts |

### Consistent Names Used Everywhere

**Projects:**
- `proj-prod-ecommerce`
- `proj-staging-ml-platform`
- `proj-dev-internal-tools`

**Resources (VMs):**
- `vm-prod-us-central1-001` through `vm-prod-us-central1-012`

**Agent Names:**
- `cost_analysis`, `anomaly_detection`, `rightsizing`, `forecast`, `report`

**Date Range:**
- All mock data: January 1, 2026 — June 28, 2026
- The anomaly spike: **June 10, 2026**

---

<a id="phase-1"></a>
## PHASE 1 — ENVIRONMENT & REPO SETUP

### 🎯 Goal
Set up the monorepo structure, create virtual environments, and install all dependencies. After this phase you should have three working sub-projects that can run independently.

### 📂 What You're Creating
```
cloudmind/
├── .env                          ← API key (gitignored)
├── .gitignore
├── README.md
├── backend/
│   ├── requirements.txt
│   └── venv/                     ← Python virtual env (gitignored)
├── mcp-server/
│   ├── requirements.txt
│   └── venv/                     ← Python virtual env (gitignored)
└── frontend/
    ├── package.json
    └── node_modules/             ← (gitignored)
```

### 📝 Step-by-Step (Do These Manually)

#### Step 1.1 — Create the folders
Open your terminal (PowerShell) and run:
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos
mkdir cloudmind
cd cloudmind
mkdir backend, mcp-server, frontend
```

#### Step 1.2 — Create the .gitignore
Create a file called `.gitignore` in the `cloudmind/` root with this content:
```
# Python
venv/
__pycache__/
*.pyc
*.db
.env

# Node
node_modules/
.next/
```

#### Step 1.3 — Create the .env file
Create `.env` in the `cloudmind/` root:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```

> [!IMPORTANT]
> Get your API key from https://aistudio.google.com/apikey
> Make sure it has access to `gemini-2.5-flash`

#### Step 1.4 — Set up the MCP Server environment
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server
python -m venv venv
.\venv\Scripts\activate
pip install fastmcp python-dotenv
pip freeze > requirements.txt
deactivate
```

#### Step 1.5 — Set up the Backend environment
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend
python -m venv venv
.\venv\Scripts\activate
pip install google-adk fastapi uvicorn python-dotenv sse-starlette
pip freeze > requirements.txt
deactivate
```

#### Step 1.6 — Set up the Frontend
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend
npx -y create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint --no-import-alias
npm install recharts
```

#### Step 1.7 — Initialize Git
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind
git init
git add .
git commit -m "Initial project structure"
```

### ✅ Verification
- [ ] `cloudmind/backend/venv/` exists
- [ ] `cloudmind/mcp-server/venv/` exists
- [ ] `cloudmind/frontend/node_modules/` exists
- [ ] `.env` file has your API key
- [ ] `.gitignore` is in root

---

<a id="phase-2"></a>
## PHASE 2 — MOCK DATA GENERATION

### 🎯 Goal
Generate realistic GCP billing data, resource inventory, utilization metrics, and budget configs. This data drives the entire demo. **Get this right and every agent has something convincing to work with.**

### 📂 What You're Creating
```
backend/
├── data/
│   ├── billing_data.json
│   ├── resource_inventory.json
│   ├── utilization_metrics.json
│   └── budgets.json
├── db/
│   ├── schema.sql
│   └── seed.py
```

### 🤖 AI PROMPT — Mock Data Generation

Copy and paste this entire prompt to your AI coding assistant:

---

> **PROMPT 2A: Generate Mock Data Files**
>
> I'm building a FinOps (cloud cost management) platform called CloudMind for a hackathon. I need realistic mock GCP billing data. Create the following 4 JSON files in `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\data\`:
>
> **File 1: `billing_data.json`**
> An array of billing records. Each record has:
> - `id`: auto-increment string like "bill-001"
> - `project_id`: one of "proj-prod-ecommerce", "proj-staging-ml-platform", "proj-dev-internal-tools"
> - `service`: one of "Compute Engine", "Cloud Storage", "BigQuery", "Cloud SQL", "Cloud Functions", "Pub/Sub", "Cloud Run", "Networking"
> - `date`: YYYY-MM-DD format, daily records from 2026-01-01 to 2026-06-28
> - `cost`: float (daily cost in USD)
> - `region`: one of "us-central1", "us-east1", "europe-west1"
> - `tags`: object with keys like "team", "environment", "app"
>
> Requirements:
> - `proj-prod-ecommerce` should have the highest costs (~$200-400/day baseline, growing 3% month-over-month)
> - `proj-staging-ml-platform` should be moderate (~$80-150/day)
> - `proj-dev-internal-tools` should be low (~$20-50/day)
> - **CRITICAL**: On 2026-06-10, `proj-prod-ecommerce` has a MASSIVE spike — BigQuery costs jump to ~$2,100 for that single day (a misconfigured job that ran 47 times). This is the anomaly our agent will detect.
> - Add slight daily randomness (±10%) to make data look realistic
> - Include seasonality (weekends slightly lower)
> - Generate at least 500 records total (don't generate every possible combination, just realistic daily totals per service per project)
>
> **File 2: `resource_inventory.json`**
> An array of 12 VM instances:
> ```json
> {
>   "resource_id": "vm-prod-us-central1-001",
>   "project_id": "proj-prod-ecommerce",
>   "name": "web-server-prod-1",
>   "type": "n2-standard-8",        // GCP machine type
>   "region": "us-central1",
>   "state": "RUNNING",              // RUNNING, STOPPED, or TERMINATED
>   "vcpus": 8,
>   "memory_gb": 32,
>   "monthly_cost": 245.50,
>   "provisioned_date": "2025-08-15",
>   "labels": {"team": "platform", "environment": "production"}
> }
> ```
> Make a mix:
> - 4 VMs that are over-provisioned (n2-standard-8 or n2-standard-16 but low utilization — these are rightsizing candidates)
> - 3 VMs that are idle/zombie (RUNNING state but near-zero utilization, costing money for nothing)
> - 3 VMs that are healthy (good utilization, right-sized)
> - 2 VMs that are stopped but still have attached disks costing money
>
> **File 3: `utilization_metrics.json`**
> An array of utilization records, one per resource per week for the last 8 weeks:
> ```json
> {
>   "resource_id": "vm-prod-us-central1-001",
>   "period_start": "2026-05-06",
>   "period_end": "2026-05-12",
>   "avg_cpu_pct": 72.3,
>   "max_cpu_pct": 94.1,
>   "avg_memory_pct": 65.8,
>   "max_memory_pct": 81.2,
>   "avg_network_mbps": 45.2
> }
> ```
> - Over-provisioned VMs: avg_cpu 5-15%, avg_memory 10-20%
> - Zombie VMs: avg_cpu 0-3%, avg_memory 2-5%
> - Healthy VMs: avg_cpu 50-80%, avg_memory 40-70%
>
> **File 4: `budgets.json`**
> ```json
> [
>   {
>     "project_id": "proj-prod-ecommerce",
>     "monthly_budget": 12000,
>     "current_month_spend": 10440,
>     "budget_used_pct": 87.0,
>     "alert_threshold_pct": 80,
>     "alert_triggered": true
>   },
>   {
>     "project_id": "proj-staging-ml-platform",
>     "monthly_budget": 5000,
>     "current_month_spend": 3200,
>     "budget_used_pct": 64.0,
>     "alert_threshold_pct": 80,
>     "alert_triggered": false
>   },
>   {
>     "project_id": "proj-dev-internal-tools",
>     "monthly_budget": 2000,
>     "current_month_spend": 980,
>     "budget_used_pct": 49.0,
>     "alert_threshold_pct": 80,
>     "alert_triggered": false
>   }
> ]
> ```
>
> Make all data internally consistent (costs in billing_data should roughly match monthly totals in budgets, resource costs should match resource_inventory, etc.)

---

### 🤖 AI PROMPT — Database Schema & Seed Script

> **PROMPT 2B: Create SQLite Schema and Seed Script**
>
> Create two files for the CloudMind project:
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\db\schema.sql`**
> Create tables for:
> - `billing_records` — columns: id INTEGER PRIMARY KEY, project_id TEXT, service TEXT, date TEXT, cost REAL, region TEXT, tags TEXT (JSON string)
> - `resources` — columns: id INTEGER PRIMARY KEY, resource_id TEXT UNIQUE, project_id TEXT, name TEXT, type TEXT, region TEXT, state TEXT, vcpus INTEGER, memory_gb REAL, monthly_cost REAL, provisioned_date TEXT, labels TEXT (JSON string)
> - `utilization_metrics` — columns: id INTEGER PRIMARY KEY, resource_id TEXT, period_start TEXT, period_end TEXT, avg_cpu_pct REAL, max_cpu_pct REAL, avg_memory_pct REAL, max_memory_pct REAL, avg_network_mbps REAL
> - `budgets` — columns: id INTEGER PRIMARY KEY, project_id TEXT UNIQUE, monthly_budget REAL, current_month_spend REAL, budget_used_pct REAL, alert_threshold_pct REAL, alert_triggered INTEGER
> - `audit_log` — columns: id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, agent_name TEXT, action TEXT, resource_id TEXT, details TEXT (JSON string), severity TEXT, session_id TEXT, status TEXT DEFAULT 'ALLOWED'
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\db\seed.py`**
> A Python script that:
> 1. Reads all 4 JSON files from `../data/`
> 2. Creates the SQLite database at `../db/cloudmind.db`
> 3. Runs the schema.sql to create tables
> 4. Inserts all data from the JSON files into the corresponding tables
> 5. Prints counts of inserted records for verification
>
> Usage: `python seed.py` (run from the `backend/db/` directory)
> The script should use relative paths so it works from that directory.

---

### ✅ Verification
After running the seed script:
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend
.\venv\Scripts\activate
cd db
python seed.py
```

Expected output:
```
Inserted X billing records
Inserted 12 resources
Inserted X utilization metrics
Inserted 3 budgets
Database seeded successfully at cloudmind.db
```

### 🔧 Troubleshooting
- **"File not found" for JSON files:** Make sure the paths in seed.py point to `../data/billing_data.json` etc.
- **"Table already exists" error:** Delete `cloudmind.db` and run seed.py again
- **Costs don't add up:** The billing data is daily, budgets are monthly. The current_month_spend in budgets should roughly equal the sum of June 2026 billing records for that project.

---

<a id="phase-3"></a>
## PHASE 3 — MCP SERVER

### 🎯 Goal
Build a custom MCP server that exposes cloud billing data, utilization metrics, and administrative actions as tools. This is the **#1 differentiator** — most hackathon teams skip building a real MCP server.

### 📂 What You're Creating
```
mcp-server/
├── server.py              ← Main FastMCP server
├── tools/
│   ├── __init__.py
│   ├── billing.py         ← Billing data tools
│   ├── utilization.py     ← Resource & utilization tools
│   ├── audit.py           ← Audit logging tool
│   └── inventory.py       ← Resource inventory tool
└── requirements.txt       ← (already created)
```

### 🤖 AI PROMPT — MCP Server

> **PROMPT 3: Build the Custom MCP Server**
>
> I'm building a custom MCP (Model Context Protocol) server for CloudMind, a FinOps AI agent platform. The MCP server provides tools that AI agents consume to access cloud billing data.
>
> **Architecture:**
> - The MCP server is a **separate process** from the agents
> - It reads from a SQLite database at `../backend/db/cloudmind.db`
> - It uses the `fastmcp` library
> - Agents connect to it via stdio transport
>
> Create the following files:
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\server.py`**
> The main server file that:
> - Imports and registers all tools from the tools/ directory
> - Creates a FastMCP server named "cloudmind-finops"
> - Sets up the database path using a relative path to `../backend/db/cloudmind.db`
> - Has a `if __name__ == "__main__": mcp.run()` block
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\tools\__init__.py`**
> Empty init file.
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\tools\billing.py`**
> Contains these tools registered on the mcp instance:
>
> ```python
> @mcp.tool()
> def get_billing_data(project_id: str, start_date: str, end_date: str) -> dict:
>     """Returns daily billing records for a project within a date range.
>     Args:
>         project_id: The GCP project ID (e.g., 'proj-prod-ecommerce')
>         start_date: Start date in YYYY-MM-DD format
>         end_date: End date in YYYY-MM-DD format
>     Returns a dict with 'records' (list of billing entries) and 'total_cost' (sum).
>     """
>
> @mcp.tool()
> def get_cost_by_service(project_id: str, start_date: str, end_date: str) -> dict:
>     """Returns cost breakdown by GCP service for a project.
>     Returns a dict with 'breakdown' (list of {service, total_cost, pct_of_total}).
>     """
>
> @mcp.tool()
> def get_top_spending_resources(project_id: str, limit: int = 5) -> dict:
>     """Returns the top N most expensive resources in a project.
>     Reads from the resources table.
>     Returns a dict with 'resources' (list of {resource_id, name, type, monthly_cost}).
>     """
>
> @mcp.tool()
> def compare_period_costs(project_id: str, period_a_start: str, period_a_end: str, period_b_start: str, period_b_end: str) -> dict:
>     """Compares total costs between two time periods for a project.
>     Returns a dict with 'period_a_cost', 'period_b_cost', 'difference', 'change_pct'.
>     """
> ```
>
> **File 4: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\tools\utilization.py`**
> ```python
> @mcp.tool()
> def get_utilization_metrics(resource_id: str, weeks: int = 4) -> dict:
>     """Returns CPU, memory, and network utilization for a resource over recent weeks.
>     Returns a dict with 'resource_id', 'metrics' (list of weekly records), and 'averages'.
>     """
>
> @mcp.tool()
> def get_budget_config(project_id: str) -> dict:
>     """Returns budget configuration and current spend for a project.
>     Returns a dict with 'project_id', 'monthly_budget', 'current_month_spend',
>     'budget_used_pct', 'alert_threshold_pct', 'alert_triggered'.
>     """
> ```
>
> **File 5: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\tools\inventory.py`**
> ```python
> @mcp.tool()
> def get_resource_inventory(project_id: str = "") -> dict:
>     """Returns all provisioned resources, optionally filtered by project.
>     If project_id is empty, returns all resources.
>     Returns a dict with 'resources' (list) and 'total_count'.
>     """
>
> @mcp.tool()
> def flag_resource_for_review(resource_id: str, reason: str, flagged_by: str) -> dict:
>     """Marks a resource for human review. This is a WRITE operation that requires
>     elevated permissions. Inserts an audit log entry.
>     Returns a dict with 'success', 'message'.
>     """
> ```
>
> **File 6: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\tools\audit.py`**
> ```python
> @mcp.tool()
> def write_audit_log(agent_name: str, action: str, details: str, severity: str = "INFO", resource_id: str = "", session_id: str = "") -> dict:
>     """Logs an agent action to the audit trail. Every agent action should be logged.
>     severity: one of INFO, WARNING, HIGH, CRITICAL
>     Returns a dict with 'success', 'log_id'.
>     """
>
> @mcp.tool()
> def get_audit_logs(limit: int = 50, agent_name: str = "", severity: str = "") -> dict:
>     """Retrieves recent audit log entries, optionally filtered.
>     Returns a dict with 'logs' (list) and 'total_count'.
>     """
> ```
>
> **Important implementation details:**
> - All tools should use a shared helper function `get_db_connection()` that returns a sqlite3 connection to `../backend/db/cloudmind.db` with `row_factory = sqlite3.Row`
> - All tools return dicts (FastMCP handles JSON serialization)
> - Use `json.loads()` for the tags/labels/details columns that store JSON strings
> - Include proper error handling with try/except — return `{"error": "message"}` on failure
> - The `flag_resource_for_review` tool should insert a record into the `audit_log` table when called
> - Use `import os` and `os.path.dirname(os.path.abspath(__file__))` to resolve the relative DB path
> - The mcp instance should be created in server.py and imported by the tool files. OR: define all tools in server.py directly and import helper functions from the tools/ modules. Pick whichever is cleaner — I prefer having server.py create the mcp instance and each tool file add tools to it.
>
> Actually, the cleanest pattern with fastmcp is to define the FastMCP instance in server.py and register all tools there by importing the tool functions from the modules and using `mcp.tool()` as decorators in server.py, OR by having each tool module receive the mcp instance. Use whatever pattern fastmcp supports best — but make sure all tools are registered on a single `mcp` instance.

---

### ✅ Verification

```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server
.\venv\Scripts\activate

# Test 1: Make sure the server starts without errors
python server.py
# It should start and wait for connections (Ctrl+C to stop)

# Test 2: Use fastmcp's built-in inspector (if available)
# Or test with a simple Python script that connects as a client
```

Create a quick test script at `mcp-server/test_tools.py`:

> **PROMPT 3B: Create MCP Server Test Script**
>
> Create a test script at `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\mcp-server\test_tools.py` that:
> 1. Imports the tool functions directly (not via MCP protocol)
> 2. Calls each tool with sample parameters
> 3. Prints the results
> 4. This is just for quick local testing — not a formal test suite
>
> Test calls:
> - `get_billing_data("proj-prod-ecommerce", "2026-06-01", "2026-06-15")`
> - `get_cost_by_service("proj-prod-ecommerce", "2026-06-01", "2026-06-15")`
> - `get_utilization_metrics("vm-prod-us-central1-001", 4)`
> - `get_budget_config("proj-prod-ecommerce")`
> - `get_resource_inventory("proj-prod-ecommerce")`
> - `write_audit_log("test", "test_action", "Testing audit log", "INFO")`
> - `get_audit_logs(10)`

---

### 🔧 Troubleshooting
- **"No such table" error:** You haven't run the seed script yet. Go back to Phase 2 verification.
- **"Database is locked" error:** Make sure no other process has the .db file open.
- **Import errors between files:** The tool modules need access to the database path. Pass it as a module-level variable or use a config file.

---

<a id="phase-4"></a>
## PHASE 4 — AGENT SECURITY & BASE LAYER

### 🎯 Goal
Build the security layer that enforces tool-level RBAC using ADK's `before_tool_callback` and `after_tool_callback`. Also set up the shared state mechanism using `ToolContext.state`. This is what separates your project from everyone else's.

### 📂 What You're Creating
```
backend/
├── agents/
│   ├── __init__.py
│   ├── config.py              ← Permission matrix, model config
│   ├── callbacks.py           ← before_tool_callback, after_tool_callback
│   └── state_manager.py       ← Shared state helpers
```

### 🤖 AI PROMPT — Security & Callbacks

> **PROMPT 4: Build the Agent Security Layer**
>
> I'm building the security layer for CloudMind's AI agents using Google ADK. This layer uses ADK's native callback system for tool-level RBAC and audit logging.
>
> Create the following files:
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\__init__.py`**
> Empty init file.
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\config.py`**
>
> This file contains:
> 1. The Gemini model name constant: `MODEL_NAME = "gemini-2.5-flash"`
> 2. The permission matrix — a dictionary mapping agent names to lists of allowed MCP tool names:
>
> ```python
> PERMISSION_MATRIX = {
>     "cost_analysis": [
>         "get_billing_data",
>         "get_cost_by_service",
>         "get_top_spending_resources",
>         "compare_period_costs",
>         "get_budget_config",
>         "write_audit_log",
>     ],
>     "anomaly_detection": [
>         "get_billing_data",
>         "get_cost_by_service",
>         "get_budget_config",
>         "get_resource_inventory",
>         "get_utilization_metrics",
>         "write_audit_log",
>         "flag_resource_for_review",  # Can flag anomalies
>     ],
>     "rightsizing": [
>         "get_utilization_metrics",
>         "get_resource_inventory",
>         "get_billing_data",
>         "write_audit_log",
>         "flag_resource_for_review",  # Can flag for resize
>     ],
>     "forecast": [
>         "get_billing_data",
>         "get_budget_config",
>         "write_audit_log",
>     ],
>     "report": [
>         "get_billing_data",
>         "get_cost_by_service",
>         "get_budget_config",
>         "get_resource_inventory",
>         "get_audit_logs",
>         "write_audit_log",
>     ],
> }
> ```
>
> 3. A helper function `get_agent_permissions(agent_name: str) -> list[str]`
> 4. A helper function `is_tool_allowed(agent_name: str, tool_name: str) -> bool`
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\callbacks.py`**
>
> This file implements ADK's native callback system:
>
> ```python
> from google.adk.tools import ToolContext
> from datetime import datetime, timezone
> import json
> import sqlite3
> import os
>
> from .config import is_tool_allowed
>
> DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
>
> def _log_to_audit(agent_name: str, tool_name: str, status: str, details: str = ""):
>     """Write directly to the audit log database."""
>     try:
>         conn = sqlite3.connect(DB_PATH)
>         conn.execute(
>             "INSERT INTO audit_log (timestamp, agent_name, action, details, status, session_id) VALUES (?, ?, ?, ?, ?, ?)",
>             (datetime.now(timezone.utc).isoformat(), agent_name, tool_name, details, status, "")
>         )
>         conn.commit()
>         conn.close()
>     except Exception:
>         pass  # Don't let logging failures break the agent
>
>
> async def before_tool_callback(tool, args, tool_context: ToolContext):
>     """
>     ADK callback that runs BEFORE every tool call.
>     Enforces permission checks and logs the attempt.
>     
>     Returns None to allow the tool call.
>     Returns a dict to BLOCK the tool call and use the dict as the result.
>     """
>     agent_name = tool_context.state.get("current_agent_name", "unknown")
>     tool_name = tool.name
>
>     if not is_tool_allowed(agent_name, tool_name):
>         # BLOCK the tool call
>         _log_to_audit(agent_name, tool_name, "DENIED", f"Permission denied for {agent_name}")
>         return {
>             "error": f"Permission denied: {agent_name} agent does not have access to {tool_name}",
>             "status": "DENIED"
>         }
>
>     # ALLOW the tool call — log it
>     _log_to_audit(agent_name, tool_name, "ALLOWED", json.dumps(args) if args else "")
>     return None  # None = proceed with the tool call
>
>
> async def after_tool_callback(tool, args, tool_context: ToolContext, tool_response):
>     """
>     ADK callback that runs AFTER every tool call.
>     Sanitizes responses and updates shared state with results.
>     """
>     agent_name = tool_context.state.get("current_agent_name", "unknown")
>     
>     # Store the latest result in shared state for other agents to access
>     results_key = f"agent_results:{agent_name}"
>     existing_results = tool_context.state.get(results_key, [])
>     
>     # Keep only last 5 results per agent to avoid state bloat
>     existing_results.append({
>         "tool": tool.name,
>         "timestamp": datetime.now(timezone.utc).isoformat(),
>         "summary": str(tool_response)[:500]  # Truncate large responses
>     })
>     tool_context.state[results_key] = existing_results[-5:]
>
>     return tool_response
> ```
>
> **File 4: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\state_manager.py`**
>
> Helper functions for managing shared state across agents using `ToolContext.state`:
>
> ```python
> from google.adk.tools import ToolContext
>
> def store_agent_findings(tool_context: ToolContext, agent_name: str, finding_type: str, data: dict):
>     """Store findings from an agent so other agents can access them."""
>     key = f"findings:{agent_name}:{finding_type}"
>     tool_context.state[key] = data
>
> def get_agent_findings(tool_context: ToolContext, agent_name: str, finding_type: str) -> dict:
>     """Retrieve findings from another agent."""
>     key = f"findings:{agent_name}:{finding_type}"
>     return tool_context.state.get(key, {})
>
> def get_all_findings(tool_context: ToolContext) -> dict:
>     """Get all stored findings from all agents."""
>     findings = {}
>     for key, value in tool_context.state.items():
>         if key.startswith("findings:"):
>             findings[key] = value
>     return findings
>
> def set_current_agent(tool_context: ToolContext, agent_name: str):
>     """Set which agent is currently executing (used by callbacks)."""
>     tool_context.state["current_agent_name"] = agent_name
> ```
>
> Make sure all imports are correct and the file paths are right. Use `google.adk.tools.ToolContext` for type hints. The callbacks use the exact parameter names that ADK expects: `tool`, `args`, `tool_context` for before_tool_callback, and `tool`, `args`, `tool_context`, `tool_response` for after_tool_callback.

---

### ✅ Verification
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend
.\venv\Scripts\activate
python -c "from agents.config import PERMISSION_MATRIX, is_tool_allowed; print(is_tool_allowed('cost_analysis', 'get_billing_data')); print(is_tool_allowed('cost_analysis', 'flag_resource_for_review'))"
```

Expected output:
```
True
False
```

---

<a id="phase-5"></a>
## PHASE 5 — SPECIALIZED AGENTS

### 🎯 Goal
Build the 5 specialized agents using Google ADK's `LlmAgent`. Each agent has a clear job, a system instruction, and access to specific MCP tools. Each agent uses the callbacks from Phase 4.

### 📂 What You're Creating
```
backend/agents/
├── cost_analysis.py
├── anomaly_detection.py
├── rightsizing.py
├── forecast.py
└── report.py
```

### 🤖 AI PROMPT — All 5 Agents

> **PROMPT 5: Build All 5 Specialized ADK Agents**
>
> I'm building 5 specialized AI agents for CloudMind using Google ADK. Each agent is an `LlmAgent` with specific tools connected to our MCP server.
>
> **Context about how ADK agents work:**
> - Each agent is a `google.adk.agents.LlmAgent`
> - Each has a `name`, `model`, `instruction` (system prompt), `description` (used by the orchestrator to decide when to route to this agent), and `tools`
> - Tools can be Python functions decorated with the MCP tool decorator, OR simple Python functions that the agent calls
> - For this project, the agents will use **local Python tool functions** that internally query our SQLite database (same data the MCP server exposes). This is because in the demo, agents and MCP run in the same process for simplicity, but the MCP server also exists as a standalone service.
>
> **IMPORTANT:** Each tool function should accept `tool_context: ToolContext` as its LAST parameter (this is how ADK injects the shared state). Import `from google.adk.tools import ToolContext`.
>
> **Database path:** `os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")`
>
> Create the following files:
>
> ---
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\cost_analysis.py`**
>
> Agent name: `cost_analysis`
> Description: "Analyzes cloud costs by service, project, tag, and time period. Answers questions about where money is being spent."
>
> System instruction:
> ```
> You are the Cost Analysis Agent for CloudMind, a FinOps platform.
> Your job is to break down cloud spending and answer questions about costs.
> You have access to billing data for 3 GCP projects: proj-prod-ecommerce,
> proj-staging-ml-platform, and proj-dev-internal-tools.
> Data is available from January 2026 to June 2026.
>
> When analyzing costs:
> 1. Always specify the exact dollar amounts
> 2. Calculate percentages when comparing periods
> 3. Identify the top spending services
> 4. Flag any unusual patterns you notice
>
> Be precise with numbers. Use USD formatting ($X,XXX.XX).
> ```
>
> Tools (as Python functions that query SQLite):
> - `get_cost_breakdown(project_id: str, start_date: str, end_date: str, tool_context: ToolContext) -> dict` — Returns cost breakdown by service
> - `get_top_spending(project_id: str, limit: int, tool_context: ToolContext) -> dict` — Returns top N spending resources
> - `compare_periods(project_id: str, period_a_start: str, period_a_end: str, period_b_start: str, period_b_end: str, tool_context: ToolContext) -> dict` — Compares costs between two periods
> - `get_budget_status(project_id: str, tool_context: ToolContext) -> dict` — Returns current budget utilization
>
> After running tools, store findings in tool_context.state using:
> `tool_context.state["findings:cost_analysis:latest"] = {summary data}`
>
> Create the agent as a module-level variable:
> ```python
> cost_analysis_agent = LlmAgent(
>     name="cost_analysis",
>     model=MODEL_NAME,
>     instruction=INSTRUCTION,
>     description=DESCRIPTION,
>     tools=[get_cost_breakdown, get_top_spending, compare_periods, get_budget_status],
> )
> ```
>
> ---
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\anomaly_detection.py`**
>
> Agent name: `anomaly_detection`
> Description: "Detects cost anomalies, spending spikes, budget overruns, and zombie resources. Alerts on unusual patterns."
>
> System instruction:
> ```
> You are the Anomaly Detection Agent for CloudMind.
> Your job is to find unusual patterns in cloud spending and resource usage.
>
> You look for:
> 1. Cost spikes — days where spending is >50% above the rolling average
> 2. Budget overruns — projects approaching or exceeding their budget
> 3. Zombie resources — VMs running with <5% CPU utilization for 2+ weeks
> 4. Orphaned resources — stopped VMs with attached disks still incurring costs
>
> When you find an anomaly:
> - Classify its severity: INFO, WARNING, HIGH, CRITICAL
> - Estimate the financial impact
> - Suggest a root cause if possible
> - Flag the resource for review if severity is HIGH or CRITICAL
>
> Always be specific about resource IDs, dates, and dollar amounts.
> ```
>
> Tools:
> - `detect_cost_spikes(project_id: str, threshold_pct: float, tool_context: ToolContext) -> dict` — Finds days where cost exceeds threshold % above the 7-day rolling average. Query billing_records, calculate daily totals, find outliers. Should definitely find the June 10 spike.
> - `check_budget_alerts(project_id: str, tool_context: ToolContext) -> dict` — Returns budget status and whether alerts are triggered
> - `identify_zombie_resources(tool_context: ToolContext) -> dict` — Finds resources with avg_cpu < 5% over the last 4 weeks. Join resources and utilization_metrics tables.
> - `flag_anomaly(resource_id: str, reason: str, severity: str, tool_context: ToolContext) -> dict` — Inserts a record into the audit_log table
>
> Store findings: `tool_context.state["findings:anomaly_detection:latest"] = {anomalies list}`
>
> ---
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\rightsizing.py`**
>
> Agent name: `rightsizing`
> Description: "Analyzes resource utilization and recommends rightsizing VMs to save money. Compares actual usage vs provisioned capacity."
>
> System instruction:
> ```
> You are the RightSizing Agent for CloudMind.
> Your job is to compare actual resource utilization against provisioned capacity
> and recommend downsizing to save money.
>
> Rightsizing rules:
> - If avg CPU < 20% AND avg memory < 30%: recommend downgrade by 2 tiers
> - If avg CPU < 40% AND avg memory < 50%: recommend downgrade by 1 tier
> - If avg CPU > 80% OR avg memory > 85%: recommend upgrade by 1 tier
> - Otherwise: resource is right-sized
>
> GCP machine type tiers (smallest to largest):
> e2-micro, e2-small, e2-medium, n2-standard-2, n2-standard-4, n2-standard-8, n2-standard-16, n2-standard-32
>
> Approximate monthly costs:
> e2-micro: $7, e2-small: $14, e2-medium: $27, n2-standard-2: $49, n2-standard-4: $97, n2-standard-8: $194, n2-standard-16: $388, n2-standard-32: $776
>
> When recommending:
> 1. State the current type and its cost
> 2. State the recommended type and its cost
> 3. Calculate monthly savings per resource
> 4. Sum up total monthly savings
>
> Always be specific with numbers.
> ```
>
> Tools:
> - `get_resource_utilization(resource_id: str, tool_context: ToolContext) -> dict` — Gets resource details + utilization metrics
> - `analyze_all_resources(project_id: str, tool_context: ToolContext) -> dict` — Gets all resources for a project with their utilization, returns list with recommendation for each
> - `calculate_savings(current_type: str, recommended_type: str, tool_context: ToolContext) -> dict` — Returns cost comparison and monthly savings
>
> Store findings: `tool_context.state["findings:rightsizing:latest"] = {recommendations list, total_savings}`
>
> ---
>
> **File 4: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\forecast.py`**
>
> Agent name: `forecast`
> Description: "Forecasts future cloud spend based on historical trends. Predicts next 30/60/90 day costs and flags budget risks."
>
> System instruction:
> ```
> You are the Forecast Agent for CloudMind.
> Your job is to predict future cloud spending based on historical trends.
>
> Your forecasting method:
> 1. Calculate monthly totals for each available month
> 2. Calculate the month-over-month growth rate
> 3. Use linear projection for the next 30/60/90 days
> 4. Compare projected spend against the monthly budget
> 5. Flag risk level: LOW (under 70%), MEDIUM (70-85%), HIGH (85-95%), CRITICAL (>95%)
>
> Keep it simple — linear regression or moving average is fine.
> Focus on clear communication of the numbers and risk levels.
> Always mention the confidence level of your forecast (low/medium/high based on data stability).
> ```
>
> Tools:
> - `get_monthly_totals(project_id: str, tool_context: ToolContext) -> dict` — Returns monthly spending totals from billing data
> - `generate_forecast(project_id: str, horizon_days: int, tool_context: ToolContext) -> dict` — Calculates projected spend using linear trend. Returns forecast amount, growth rate, and budget comparison.
> - `assess_budget_risk(project_id: str, tool_context: ToolContext) -> dict` — Compares forecast vs budget, returns risk level
>
> Store findings: `tool_context.state["findings:forecast:latest"] = {forecast data, risk level}`
>
> ---
>
> **File 5: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\report.py`**
>
> Agent name: `report`
> Description: "Generates audience-appropriate reports. Creates executive summaries for CFOs and detailed action plans for engineering teams."
>
> System instruction:
> ```
> You are the Report Agent for CloudMind.
> Your job is to generate clear, audience-appropriate reports from findings
> produced by other agents.
>
> You generate two types of reports:
>
> 1. CFO REPORT (audience: "cfo"):
>    - Executive summary in plain business language
>    - Total dollar impact and risk level
>    - Month-over-month trend
>    - Top 3 action items with estimated savings
>    - No technical jargon, no resource IDs
>
> 2. ENGINEERING REPORT (audience: "engineering"):
>    - Detailed resource-level findings
>    - Specific resource IDs and instance types
>    - Step-by-step remediation actions (include gcloud commands where relevant)
>    - Priority ranking (P0/P1/P2)
>    - Timeline for each action
>
> Always read findings from other agents via the shared state before generating.
> Format reports in clean Markdown.
> ```
>
> Tools:
> - `get_all_agent_findings(tool_context: ToolContext) -> dict` — Reads ALL findings from tool_context.state (keys starting with "findings:")
> - `generate_report(audience: str, tool_context: ToolContext) -> dict` — Note: this tool mostly reads from state and returns a structured dict. The actual narrative is generated by the LLM based on the data.
>
> **Important:** The report agent is unique — it primarily reads from shared state rather than querying the database directly. Its main value is in the LLM's instruction to format findings differently based on the audience.
>
> Store findings: `tool_context.state["findings:report:latest"] = {report_type, content}`
>
> ---
>
> **For ALL agents:**
> - Import `from google.adk.agents import LlmAgent`
> - Import `from google.adk.tools import ToolContext`
> - Import `from .config import MODEL_NAME`
> - Each agent should be exported as a module-level variable (e.g., `cost_analysis_agent`)
> - Each tool function must have proper docstrings (ADK uses these as tool descriptions for the LLM)
> - Each tool function must have typed parameters (ADK uses these for schema generation)
> - DB helper: create a shared `_get_db()` function in each file or in a shared utils module

---

### ✅ Verification
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend
.\venv\Scripts\activate
python -c "from agents.cost_analysis import cost_analysis_agent; print(cost_analysis_agent.name)"
python -c "from agents.anomaly_detection import anomaly_detection_agent; print(anomaly_detection_agent.name)"
python -c "from agents.rightsizing import rightsizing_agent; print(rightsizing_agent.name)"
python -c "from agents.forecast import forecast_agent; print(forecast_agent.name)"
python -c "from agents.report import report_agent; print(report_agent.name)"
```

Each should print the agent's name without errors.

### 🔧 Troubleshooting
- **"ModuleNotFoundError: google.adk"**: Make sure you activated the backend venv
- **Tool function errors**: Make sure every tool has `tool_context: ToolContext` as the LAST parameter
- **Import errors**: Check that `agents/__init__.py` exists and is empty

---

<a id="phase-6"></a>
## PHASE 6 — ORCHESTRATOR AGENT

### 🎯 Goal
Build the root orchestrator that uses ADK's **native `sub_agents` pattern** (NOT tool wrappers) to delegate work to specialized agents. This is the correct ADK multi-agent pattern.

### 📂 What You're Creating
```
backend/agents/
└── orchestrator.py
```

### 🤖 AI PROMPT — Orchestrator

> **PROMPT 6: Build the Orchestrator Agent**
>
> I'm building the orchestrator for CloudMind — the root agent that receives user queries and delegates to 5 specialized sub-agents using Google ADK's native `sub_agents` pattern.
>
> Create: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\agents\orchestrator.py`
>
> **Key design: Use ADK's native sub_agents, NOT tool wrappers.**
>
> ```python
> from google.adk.agents import LlmAgent
> from .config import MODEL_NAME
> from .callbacks import before_tool_callback, after_tool_callback
> from .cost_analysis import cost_analysis_agent
> from .anomaly_detection import anomaly_detection_agent
> from .rightsizing import rightsizing_agent
> from .forecast import forecast_agent
> from .report import report_agent
>
>
> ORCHESTRATOR_INSTRUCTION = """
> You are CloudMind, an AI-powered FinOps orchestrator.
> You manage a team of specialized agents to help users understand and optimize
> their cloud costs across GCP projects.
>
> YOUR AVAILABLE TEAM:
> 1. cost_analysis — Breaks down spending by service, project, and time period
> 2. anomaly_detection — Finds cost spikes, zombie resources, and budget overruns
> 3. rightsizing — Recommends VM downsizing based on actual utilization
> 4. forecast — Predicts future spending and flags budget risks
> 5. report — Generates CFO or Engineering reports from findings
>
> WHEN TO DELEGATE:
> - Questions about costs/spending → cost_analysis
> - Questions about spikes/anomalies/unusual patterns → anomaly_detection
> - Questions about optimization/savings/rightsizing → rightsizing
> - Questions about future spend/budget projections → forecast
> - Requests for reports/summaries → report (ALWAYS run other agents first to populate findings)
>
> HOW TO WORK:
> 1. Understand the user's question
> 2. Decide which agents to consult (often 2-3 agents for complex questions)
> 3. Delegate to each relevant agent
> 4. Synthesize their findings into a clear, unified answer
>
> IMPORTANT:
> - For complex questions, call multiple agents in sequence
> - Always start with data-gathering agents before the report agent
> - Be specific with dollar amounts and percentages
> - If asked for a report, first gather data from relevant agents, then call report
>
> The GCP projects available are:
> - proj-prod-ecommerce (production, highest spend)
> - proj-staging-ml-platform (staging/ML workloads)
> - proj-dev-internal-tools (development, lowest spend)
>
> Data is available from January 2026 to June 2026.
> """
>
> # Create the orchestrator with sub_agents (ADK's native multi-agent pattern)
> orchestrator_agent = LlmAgent(
>     name="orchestrator",
>     model=MODEL_NAME,
>     instruction=ORCHESTRATOR_INSTRUCTION,
>     description="Root orchestrator that delegates FinOps queries to specialized agents",
>     sub_agents=[
>         cost_analysis_agent,
>         anomaly_detection_agent,
>         rightsizing_agent,
>         forecast_agent,
>         report_agent,
>     ],
>     # Register callbacks at the orchestrator level — they apply to all sub-agents
>     before_tool_callback=before_tool_callback,
>     after_tool_callback=after_tool_callback,
> )
> ```
>
> **Important notes:**
> - The `sub_agents` parameter is ADK's native way to do multi-agent orchestration
> - ADK automatically handles routing based on each sub-agent's `description`
> - The `before_tool_callback` and `after_tool_callback` are set on the orchestrator — verify if ADK propagates these to sub-agents or if they need to be set on each agent individually. If they don't propagate, set them on each sub-agent in their respective files.
> - The orchestrator itself doesn't need tools — it delegates to agents that have tools
>
> Also export a helper function for running the orchestrator:
>
> ```python
> from google.adk.runners import Runner
> from google.adk.sessions import InMemorySessionService
>
> session_service = InMemorySessionService()
>
> async def run_orchestrator(user_message: str, session_id: str = None) -> str:
>     """Run the orchestrator with a user message and return the response."""
>     runner = Runner(
>         agent=orchestrator_agent,
>         app_name="cloudmind",
>         session_service=session_service,
>     )
>     
>     if session_id is None:
>         session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
>     
>     # Create or get session
>     session = await session_service.get_session(
>         app_name="cloudmind",
>         user_id="default_user",
>         session_id=session_id,
>     )
>     if session is None:
>         session = await session_service.create_session(
>             app_name="cloudmind",
>             user_id="default_user",
>             session_id=session_id,
>             state={"current_agent_name": "orchestrator"}
>         )
>     
>     # Run the agent
>     from google.adk.agents import types
>     content = types.Content(
>         role="user",
>         parts=[types.Part(text=user_message)]
>     )
>     
>     response_text = ""
>     async for event in runner.run_async(
>         user_id="default_user",
>         session_id=session_id,
>         new_message=content,
>     ):
>         if event.is_final_response() and event.content and event.content.parts:
>             response_text = event.content.parts[0].text
>     
>     return response_text
> ```
>
> **Note about imports:** The exact ADK API might vary slightly. Check the installed version's API. The key classes are:
> - `google.adk.agents.LlmAgent`
> - `google.adk.runners.Runner`
> - `google.adk.sessions.InMemorySessionService`
>
> If any import fails, check `pip show google-adk` for the version and adjust accordingly.

---

### ✅ Verification
Create a test script at `backend/test_orchestrator.py`:

> **PROMPT 6B: Create Orchestrator Test Script**
>
> Create `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\test_orchestrator.py`:
>
> ```python
> import asyncio
> import os
> from dotenv import load_dotenv
>
> # Load API key from root .env
> load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
>
> from agents.orchestrator import run_orchestrator
>
> async def main():
>     # Test 1: Simple cost question
>     print("=" * 60)
>     print("TEST 1: Cost question")
>     print("=" * 60)
>     result = await run_orchestrator("What did proj-prod-ecommerce spend in June 2026?")
>     print(result)
>     print()
>
>     # Test 2: Anomaly detection
>     print("=" * 60)
>     print("TEST 2: Anomaly detection")
>     print("=" * 60)
>     result = await run_orchestrator("Were there any cost anomalies or spikes recently?")
>     print(result)
>     print()
>
>     # Test 3: Complex multi-agent question (THE DEMO QUESTION)
>     print("=" * 60)
>     print("TEST 3: Multi-agent question")
>     print("=" * 60)
>     result = await run_orchestrator(
>         "Why did our production costs spike recently and what should we do about it?"
>     )
>     print(result)
>
> if __name__ == "__main__":
>     asyncio.run(main())
> ```
>
> Run with: `python test_orchestrator.py`

---

### 🔧 Troubleshooting
- **"GOOGLE_API_KEY not set"**: Make sure `.env` in root has the key and `load_dotenv` points to it
- **Agent doesn't delegate**: Check that each sub-agent's `description` clearly describes its role — ADK uses this for routing
- **"before_tool_callback" not firing**: Callbacks might need to be registered on each sub-agent, not just the orchestrator. Try both approaches.
- **Timeout errors**: Gemini API calls can take 5-15 seconds. Be patient with multi-agent flows.

---

<a id="phase-7"></a>
## PHASE 7 — FASTAPI BACKEND

### 🎯 Goal
Create the FastAPI backend with REST endpoints and SSE (Server-Sent Events) streaming for the chat interface. The backend connects the frontend to the agent system.

### 📂 What You're Creating
```
backend/
├── main.py                ← FastAPI app
├── routers/
│   ├── __init__.py
│   ├── chat.py            ← Chat endpoint with SSE streaming
│   ├── reports.py         ← Report generation endpoints
│   ├── alerts.py          ← Anomaly alerts endpoint
│   ├── forecast.py        ← Forecast endpoint
│   └── audit.py           ← Audit log endpoint
└── test_orchestrator.py   ← (from Phase 6)
```

### 🤖 AI PROMPT — FastAPI Backend

> **PROMPT 7: Build the FastAPI Backend**
>
> I'm building the FastAPI backend for CloudMind. It connects a Next.js frontend to the ADK agent system.
>
> Create the following files:
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\main.py`**
>
> The main FastAPI app:
> - Load `.env` from parent directory for GOOGLE_API_KEY
> - Enable CORS for `http://localhost:3000` (Next.js dev server)
> - Include all routers
> - Add a root health check endpoint
> - Run with uvicorn on port 8000
>
> ```python
> from fastapi import FastAPI
> from fastapi.middleware.cors import CORSMiddleware
> from dotenv import load_dotenv
> import os
>
> load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
>
> app = FastAPI(title="CloudMind API", description="AI FinOps Agent Platform")
>
> app.add_middleware(
>     CORSMiddleware,
>     allow_origins=["http://localhost:3000"],
>     allow_credentials=True,
>     allow_methods=["*"],
>     allow_headers=["*"],
> )
>
> # Include routers
> from routers import chat, reports, alerts, forecast, audit
> app.include_router(chat.router, prefix="/api", tags=["Chat"])
> app.include_router(reports.router, prefix="/api", tags=["Reports"])
> app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
> app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
> app.include_router(audit.router, prefix="/api", tags=["Audit"])
>
> @app.get("/")
> def health_check():
>     return {"status": "healthy", "service": "cloudmind-api"}
>
> if __name__ == "__main__":
>     import uvicorn
>     uvicorn.run(app, host="0.0.0.0", port=8000)
> ```
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\__init__.py`**
> Empty file.
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\chat.py`**
>
> The chat endpoint with SSE streaming:
> ```python
> from fastapi import APIRouter, Request
> from fastapi.responses import StreamingResponse
> from pydantic import BaseModel
> import json
> import asyncio
>
> router = APIRouter()
>
> class ChatRequest(BaseModel):
>     message: str
>     session_id: str = None
>
> @router.post("/chat")
> async def chat_endpoint(request: ChatRequest):
>     """Non-streaming chat endpoint. Sends message to orchestrator, returns final response."""
>     from agents.orchestrator import run_orchestrator
>     response = await run_orchestrator(request.message, request.session_id)
>     return {"response": response, "session_id": request.session_id}
>
> @router.post("/chat/stream")
> async def chat_stream_endpoint(request: ChatRequest):
>     """SSE streaming chat endpoint. Streams agent activity as events."""
>     from agents.orchestrator import run_orchestrator_streaming
>     
>     async def event_generator():
>         async for event in run_orchestrator_streaming(request.message, request.session_id):
>             yield f"data: {json.dumps(event)}\n\n"
>         yield f"data: {json.dumps({'type': 'done'})}\n\n"
>     
>     return StreamingResponse(event_generator(), media_type="text/event-stream")
> ```
>
> **IMPORTANT:** You'll need to add a `run_orchestrator_streaming` function to the orchestrator that yields events as the agents work. Each event should be a dict like:
> ```json
> {"type": "agent_start", "agent": "anomaly_detection", "message": "Analyzing cost anomalies..."}
> {"type": "agent_result", "agent": "anomaly_detection", "message": "Found 1 major spike on June 10"}
> {"type": "agent_start", "agent": "rightsizing", "message": "Checking resource utilization..."}
> {"type": "agent_result", "agent": "rightsizing", "message": "Found 4 over-provisioned VMs"}
> {"type": "final_response", "message": "Here's the complete analysis..."}
> ```
>
> Add this streaming function to `orchestrator.py`:
> ```python
> async def run_orchestrator_streaming(user_message: str, session_id: str = None):
>     """Run orchestrator and yield SSE events for each agent step."""
>     runner = Runner(
>         agent=orchestrator_agent,
>         app_name="cloudmind",
>         session_service=session_service,
>     )
>     
>     if session_id is None:
>         session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
>     
>     session = await session_service.get_session(
>         app_name="cloudmind", user_id="default_user", session_id=session_id
>     )
>     if session is None:
>         session = await session_service.create_session(
>             app_name="cloudmind", user_id="default_user", session_id=session_id,
>             state={"current_agent_name": "orchestrator"}
>         )
>     
>     content = types.Content(role="user", parts=[types.Part(text=user_message)])
>     
>     async for event in runner.run_async(
>         user_id="default_user", session_id=session_id, new_message=content
>     ):
>         # Yield agent activity events
>         if hasattr(event, 'agent_name') and event.agent_name:
>             yield {
>                 "type": "agent_activity",
>                 "agent": event.agent_name,
>                 "message": f"Agent {event.agent_name} is working..."
>             }
>         
>         if event.is_final_response() and event.content and event.content.parts:
>             yield {
>                 "type": "final_response",
>                 "message": event.content.parts[0].text
>             }
> ```
>
> **File 4: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\reports.py`**
> ```python
> router = APIRouter()
>
> @router.get("/reports/generate")
> async def generate_report(audience: str = "cfo", project_id: str = "proj-prod-ecommerce"):
>     """Generate a CFO or Engineering report by running the full agent pipeline."""
>     from agents.orchestrator import run_orchestrator
>     prompt = f"Generate a {audience} report for {project_id}. First analyze costs, check for anomalies, get rightsizing recommendations, then generate the {audience} report."
>     response = await run_orchestrator(prompt)
>     return {"report": response, "audience": audience, "project_id": project_id}
>
> @router.get("/reports/weekly")
> async def weekly_digest():
>     """Generate a weekly digest across all projects."""
>     from agents.orchestrator import run_orchestrator
>     response = await run_orchestrator(
>         "Generate a weekly digest report covering all three projects. Include cost trends, any anomalies, and top recommendations."
>     )
>     return {"report": response, "type": "weekly_digest"}
> ```
>
> **File 5: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\alerts.py`**
> ```python
> router = APIRouter()
>
> @router.get("/alerts")
> async def get_alerts():
>     """Get current alerts — run anomaly detection across all projects."""
>     from agents.orchestrator import run_orchestrator
>     response = await run_orchestrator(
>         "Check all three projects for anomalies, cost spikes, zombie resources, and budget overruns. List all findings."
>     )
>     return {"alerts": response}
>
> @router.get("/alerts/quick")
> async def get_quick_alerts():
>     """Get budget alerts directly from database (no agent needed)."""
>     import sqlite3, os, json
>     db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
>     conn = sqlite3.connect(db_path)
>     conn.row_factory = sqlite3.Row
>     budgets = [dict(row) for row in conn.execute("SELECT * FROM budgets").fetchall()]
>     conn.close()
>     alerts = [b for b in budgets if b.get("alert_triggered")]
>     return {"alerts": alerts, "total": len(alerts)}
> ```
>
> **File 6: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\forecast.py`**
> ```python
> router = APIRouter()
>
> @router.get("/forecast/{project_id}")
> async def get_forecast(project_id: str, horizon_days: int = 30):
>     """Get spending forecast for a project."""
>     from agents.orchestrator import run_orchestrator
>     response = await run_orchestrator(
>         f"Generate a {horizon_days}-day spending forecast for {project_id}. Include budget risk assessment."
>     )
>     return {"forecast": response, "project_id": project_id, "horizon_days": horizon_days}
> ```
>
> **File 7: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend\routers\audit.py`**
> ```python
> router = APIRouter()
>
> @router.get("/audit-log")
> async def get_audit_log(limit: int = 50, agent_name: str = "", severity: str = ""):
>     """Get audit log entries directly from database."""
>     import sqlite3, os, json
>     db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
>     conn = sqlite3.connect(db_path)
>     conn.row_factory = sqlite3.Row
>     
>     query = "SELECT * FROM audit_log WHERE 1=1"
>     params = []
>     if agent_name:
>         query += " AND agent_name = ?"
>         params.append(agent_name)
>     if severity:
>         query += " AND severity = ?"
>         params.append(severity)
>     query += " ORDER BY timestamp DESC LIMIT ?"
>     params.append(limit)
>     
>     logs = [dict(row) for row in conn.execute(query, params).fetchall()]
>     conn.close()
>     return {"logs": logs, "total": len(logs)}
>
> @router.get("/dashboard/summary")
> async def dashboard_summary():
>     """Quick dashboard data — no agents needed, direct DB queries."""
>     import sqlite3, os
>     db_path = os.path.join(os.path.dirname(__file__), "..", "db", "cloudmind.db")
>     conn = sqlite3.connect(db_path)
>     conn.row_factory = sqlite3.Row
>     
>     # Total spend by project (June 2026)
>     spend_by_project = [dict(row) for row in conn.execute(
>         "SELECT project_id, SUM(cost) as total_cost FROM billing_records WHERE date >= '2026-06-01' GROUP BY project_id"
>     ).fetchall()]
>     
>     # Spend by service (all projects, June)
>     spend_by_service = [dict(row) for row in conn.execute(
>         "SELECT service, SUM(cost) as total_cost FROM billing_records WHERE date >= '2026-06-01' GROUP BY service ORDER BY total_cost DESC"
>     ).fetchall()]
>     
>     # Budget status
>     budgets = [dict(row) for row in conn.execute("SELECT * FROM budgets").fetchall()]
>     
>     # Recent audit logs
>     recent_logs = [dict(row) for row in conn.execute(
>         "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10"
>     ).fetchall()]
>     
>     # Resource count
>     resource_count = conn.execute("SELECT COUNT(*) as count FROM resources").fetchone()["count"]
>     
>     conn.close()
>     return {
>         "spend_by_project": spend_by_project,
>         "spend_by_service": spend_by_service,
>         "budgets": budgets,
>         "recent_audit_logs": recent_logs,
>         "total_resources": resource_count,
>     }
> ```

---

### ✅ Verification
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\backend
.\venv\Scripts\activate
python main.py
```

Then open your browser to:
- `http://localhost:8000/` → should return `{"status": "healthy"}`
- `http://localhost:8000/api/audit-log` → should return audit log entries
- `http://localhost:8000/api/alerts/quick` → should return budget alerts
- `http://localhost:8000/api/dashboard/summary` → should return dashboard data
- `http://localhost:8000/docs` → should show Swagger UI with all endpoints

---

<a id="phase-8"></a>
## PHASE 8 — FRONTEND CORE

### 🎯 Goal
Build the Next.js frontend with a stunning dashboard, chat interface, and report viewer. The UI should be visually impressive — this is what judges see first.

### 📂 What You're Creating
```
frontend/
├── app/
│   ├── layout.tsx          ← Root layout with sidebar nav
│   ├── page.tsx            ← Dashboard
│   ├── globals.css         ← Global styles
│   ├── chat/
│   │   └── page.tsx        ← Agent chat interface
│   ├── reports/
│   │   └── page.tsx        ← CFO/Eng report viewer
│   ├── alerts/
│   │   └── page.tsx        ← Anomaly alerts
│   ├── forecast/
│   │   └── page.tsx        ← Spend forecast
│   └── audit/
│       └── page.tsx        ← Audit log viewer
├── components/
│   ├── Sidebar.tsx         ← Navigation sidebar
│   ├── ChatMessage.tsx     ← Chat bubble component
│   ├── AgentActivity.tsx   ← Shows which agent is working
│   ├── CostChart.tsx       ← Recharts cost visualization
│   └── AlertCard.tsx       ← Alert display card
└── lib/
    └── api.ts              ← API client functions
```

### 🤖 AI PROMPT — API Client

> **PROMPT 8A: Create the API Client**
>
> Create `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\lib\api.ts`:
>
> A TypeScript module that provides functions to call the CloudMind backend API at `http://localhost:8000`.
>
> Functions needed:
> ```typescript
> const API_BASE = "http://localhost:8000/api";
>
> // Dashboard
> export async function getDashboardSummary(): Promise<DashboardData>
>
> // Chat (non-streaming)
> export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse>
>
> // Chat (streaming via SSE)
> export function streamChatMessage(message: string, sessionId?: string,
>     onEvent: (event: AgentEvent) => void, onDone: () => void): () => void
>     // Returns a cleanup function to abort the stream
>
> // Reports
> export async function generateReport(audience: "cfo" | "engineering", projectId?: string): Promise<ReportResponse>
>
> // Alerts
> export async function getAlerts(): Promise<AlertsResponse>
> export async function getQuickAlerts(): Promise<QuickAlertsResponse>
>
> // Forecast
> export async function getForecast(projectId: string, horizonDays?: number): Promise<ForecastResponse>
>
> // Audit Log
> export async function getAuditLog(limit?: number, agentName?: string): Promise<AuditLogResponse>
> ```
>
> Include TypeScript interfaces for all response types.
>
> For the SSE streaming function, use `fetch` with `ReadableStream` to parse SSE events:
> ```typescript
> export function streamChatMessage(
>     message: string,
>     sessionId: string | undefined,
>     onEvent: (event: AgentEvent) => void,
>     onDone: () => void
> ): () => void {
>     const controller = new AbortController();
>     
>     fetch(`${API_BASE}/chat/stream`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ message, session_id: sessionId }),
>         signal: controller.signal,
>     }).then(async (response) => {
>         const reader = response.body?.getReader();
>         const decoder = new TextDecoder();
>         // ... parse SSE lines, call onEvent for each, call onDone when finished
>     });
>     
>     return () => controller.abort();
> }
> ```

---

### 🤖 AI PROMPT — Layout & Sidebar

> **PROMPT 8B: Create Root Layout and Sidebar**
>
> Create the root layout and sidebar for CloudMind's Next.js frontend.
>
> **Design Requirements:**
> - Dark theme (background: #0a0a0f or similar deep dark)
> - Sidebar on the left with glassmorphism effect (semi-transparent, blur backdrop)
> - Gradient accent colors: use a blue-to-purple gradient (#3b82f6 → #8b5cf6)
> - Font: Inter from Google Fonts
> - The sidebar should have the CloudMind logo/name at top, then nav links:
>   - 🏠 Dashboard (/)
>   - 💬 Chat (/chat)
>   - 📊 Reports (/reports)
>   - 🚨 Alerts (/alerts)
>   - 📈 Forecast (/forecast)
>   - 📋 Audit Log (/audit)
> - Active nav link should have a gradient highlight
> - Sidebar should be fixed, main content scrollable
> - Add subtle hover animations on nav links
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\globals.css`**
> Reset the default Next.js styles. Set up:
> - Dark background
> - CSS custom properties for the color scheme
> - Scrollbar styling
> - Smooth transitions
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\components\Sidebar.tsx`**
> - Client component ("use client")
> - Use `usePathname()` from next/navigation for active state
> - Each nav item has an emoji icon + label
> - Glassmorphism card style
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\layout.tsx`**
> - Import Inter font
> - Meta tags: title "CloudMind — AI FinOps Platform", description
> - Sidebar on left (fixed width ~250px)
> - Main content area takes remaining width with padding

---

### 🤖 AI PROMPT — Dashboard Page

> **PROMPT 8C: Build the Dashboard Page**
>
> Create the main dashboard at `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\page.tsx`
>
> This is a "use client" component that fetches data from `GET /api/dashboard/summary` on mount.
>
> **Layout (grid):**
> Row 1: Three stat cards showing total spend per project
> Row 2: Cost by service bar chart (Recharts) + Budget status cards  
> Row 3: Recent audit log entries (mini-table)
>
> **Design:**
> - Cards with glassmorphism (backdrop-blur, semi-transparent backgrounds)
> - Stat cards show project name, total June spend, and a small trend indicator (↑ or ↓ with percentage)
> - Budget cards show project name, a circular progress indicator, and "87% of budget used" text. Color-coded: green (<70%), yellow (70-85%), red (>85%)
> - Bar chart: horizontal bars, dark background, gradient fill bars (blue→purple)
> - Audit log: dark table with alternating row opacity, colored severity badges
> - Add loading skeletons while data loads
> - Use proper number formatting ($12,450.00)
>
> **Chart component:** Create `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\components\CostChart.tsx`
> - Uses Recharts BarChart
> - Dark theme (dark background, light text, gradient bars)
> - Responsive container
> - Tooltip on hover showing exact values
>
> **Alert card component:** Create `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\components\AlertCard.tsx`
> - Shows project name, budget used %, current spend vs budget
> - Color-coded border/glow based on severity
> - Subtle pulse animation if alert is triggered

---

### 🤖 AI PROMPT — Chat Page

> **PROMPT 8D: Build the Chat Interface**
>
> Create the chat page at `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\chat\page.tsx`
>
> This is the **hero feature** — where users talk to the orchestrator agent.
>
> **Layout:**
> - Full height chat window (flex column)
> - Message history area (scrollable, takes remaining space)
> - Agent activity panel on the right side (shows which agents are working)
> - Input bar at the bottom (text input + send button)
>
> **Features:**
> - Messages show as chat bubbles: user messages on right (blue gradient), agent responses on left (dark glass)
> - **Agent activity indicator**: When streaming, show a panel that displays real-time agent activity:
>   - "🔍 Anomaly Detection Agent analyzing..." (with spinning indicator)
>   - "✅ Found 1 major cost spike"
>   - "🔍 RightSizing Agent checking resources..."
>   - "✅ 4 VMs identified for downsizing"
> - Support both streaming (SSE) and non-streaming modes (fall back to non-streaming if SSE fails)
> - Auto-scroll to bottom on new messages
> - Markdown rendering in agent responses (use a simple approach — even just dangerouslySetInnerHTML with basic markdown-to-HTML conversion, or install react-markdown)
> - Show a typing indicator while waiting for response
> - Preset quick-action buttons above the input:
>   - "Why did costs spike?" → sends the demo question
>   - "Generate CFO report"
>   - "Find zombie resources"
>   - "30-day forecast"
>
> **Components to create:**
>
> `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\components\ChatMessage.tsx`
> - Props: message (string), role ("user" | "agent"), timestamp
> - User messages: right-aligned, blue gradient background
> - Agent messages: left-aligned, dark glass background, with CloudMind avatar icon
>
> `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\components\AgentActivity.tsx`
> - Props: activities (array of {agent, status, message})
> - Shows a vertical timeline of agent activity
> - Active agent has a spinning indicator
> - Completed agents have a checkmark
> - Color-coded by agent (each agent gets a consistent color)
>
> **Design:**
> - Dark theme consistent with dashboard
> - Input bar has a subtle glow effect on focus
> - Send button has gradient and hover animation
> - Messages appear with a subtle fade-in animation

---

### 🤖 AI PROMPT — Remaining Pages

> **PROMPT 8E: Build Reports, Alerts, Forecast, and Audit Pages**
>
> Create the remaining 4 pages for CloudMind:
>
> **File 1: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\reports\page.tsx`**
> - Toggle between "CFO Report" and "Engineering Report" using two tabs/buttons
> - "Generate Report" button that calls the API
> - Project selector dropdown (3 projects)
> - Display the generated report in a formatted card
> - Show loading state with skeleton while generating
> - Render report text as Markdown
> - Design: premium card with gradient header, clean typography
>
> **File 2: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\alerts\page.tsx`**
> - Shows anomaly alerts from the API
> - Cards for each alert with severity badge (INFO=blue, WARNING=yellow, HIGH=orange, CRITICAL=red)
> - "Run Anomaly Scan" button to trigger fresh scan
> - Quick-view budget status cards at the top (from /api/alerts/quick)
> - Animated entry for each alert card
>
> **File 3: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\forecast\page.tsx`**
> - Project selector
> - Horizon selector (30/60/90 days)
> - "Generate Forecast" button
> - Display forecast results
> - Risk level indicator (color-coded badge)
> - If possible, show a simple line chart (Recharts LineChart) projecting from historical to forecast
>
> **File 4: `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend\app\audit\page.tsx`**
> - Table showing all audit log entries
> - Columns: Timestamp, Agent, Action, Resource ID, Severity, Status
> - Filter by agent name (dropdown)
> - Filter by severity (dropdown)
> - Color-coded Status column: ALLOWED (green), DENIED (red)
> - Auto-refresh every 10 seconds
> - This is where you show permission denials — highlight rows where status = DENIED
>
> **Design for ALL pages:**
> - Consistent dark theme with glassmorphism cards
> - Loading skeletons/spinners
> - Proper error states ("Failed to load data — try again")
> - Responsive (works on different screen sizes)
> - Subtle animations on interaction

---

### ✅ Verification
```powershell
cd C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\frontend
npm run dev
```

Then check:
- `http://localhost:3000/` → Dashboard with charts and stats
- `http://localhost:3000/chat` → Chat interface
- `http://localhost:3000/reports` → Report generator
- `http://localhost:3000/alerts` → Alerts page
- `http://localhost:3000/forecast` → Forecast page
- `http://localhost:3000/audit` → Audit log table

> [!IMPORTANT]
> The backend must be running simultaneously (`python main.py` in the backend directory) for the frontend to fetch data.

---

<a id="phase-9"></a>
## PHASE 9 — FRONTEND POLISH & INTEGRATION

### 🎯 Goal
Polish the UI, fix integration bugs, add the "wow" factor details, and make everything demo-ready.

### 🤖 AI PROMPT — Polish

> **PROMPT 9: Frontend Polish and Agent Visualization**
>
> I need to polish the CloudMind frontend for a hackathon demo. Make these improvements:
>
> 1. **Agent Permission Badges**: On the chat page's agent activity panel, add a small badge showing each agent's permission level:
>    - cost_analysis: "READ ONLY" (green badge)
>    - anomaly_detection: "READ + FLAG" (yellow badge)
>    - rightsizing: "READ + FLAG" (yellow badge)
>    - forecast: "READ ONLY" (green badge)
>    - report: "READ ONLY" (green badge)
>
> 2. **Animated Dashboard**: Add number count-up animations on the stat cards (numbers animate from 0 to final value when the page loads)
>
> 3. **Gradient backgrounds**: Add subtle animated gradient backgrounds to page headers
>
> 4. **Toast Notifications**: When an agent completes its work, show a small toast notification: "✅ Anomaly Detection complete — 1 spike found"
>
> 5. **Session State Debug Panel** (togglable): On the chat page, add a small toggleable panel at the bottom that shows the current `session.state` contents. This proves shared memory is working. Show it as a JSON viewer with syntax highlighting.
>
> 6. **"Powered by Google ADK" badge** in the footer/sidebar
>
> 7. **Smooth page transitions** between routes
>
> 8. **Empty states**: For pages with no data yet (first load), show friendly illustrations or messages instead of blank screens

---

### ✅ Integration Test Checklist

Run both backend and frontend simultaneously, then test these flows:

- [ ] Dashboard loads with real data from the API
- [ ] Chat: Send "What did prod-ecommerce spend in June?" → get a response
- [ ] Chat: Send "Why did costs spike and what should we do?" → see multi-agent activity
- [ ] Reports: Generate CFO report → readable business summary appears
- [ ] Reports: Generate Engineering report → detailed technical report appears
- [ ] Alerts: Quick alerts show budget warnings
- [ ] Forecast: 30-day forecast for prod-ecommerce
- [ ] Audit: Table shows logged agent actions with timestamps
- [ ] Audit: At least one DENIED entry appears (test by making cost agent try to flag a resource)
- [ ] Sidebar navigation works between all pages
- [ ] No console errors in browser dev tools

---

<a id="phase-10"></a>
## PHASE 10 — VIDEO, README, WRITEUP & SUBMISSION

### 🎯 Goal
Record the demo video, write the README, create the Kaggle writeup, and submit. **The video is a MANDATORY submission requirement.**

### 📝 Step 10.1 — README

> **PROMPT 10A: Write the README**
>
> Create `C:\Users\jahag\OneDrive\Desktop\repos\cloudmind\README.md`:
>
> Write a professional README for CloudMind with these sections:
>
> 1. **Header**: CloudMind logo/title, tagline, badges (Python, TypeScript, Google ADK)
> 2. **Problem**: 2-3 sentences on why cloud cost management is broken
> 3. **Solution**: What CloudMind does
> 4. **Architecture Diagram**: ASCII art showing the system architecture (Frontend → Backend → Orchestrator → 5 Agents → MCP Server → SQLite)
> 5. **ADK Concepts Demonstrated** (numbered list):
>    - Multi-agent orchestration with native sub_agents
>    - Custom MCP server with 8 tools
>    - Agent skills with typed interfaces
>    - Callbacks & Guardrails (before_tool_callback, after_tool_callback)
>    - Security: tool-level RBAC with permission matrix
>    - Shared state via ToolContext.state
> 6. **Tech Stack**: table format
> 7. **Quick Start** (step-by-step):
>    ```
>    # 1. Clone and set up
>    git clone <repo-url>
>    cd cloudmind
>    
>    # 2. Add your API key
>    echo "GOOGLE_API_KEY=your_key_here" > .env
>    
>    # 3. Set up backend
>    cd backend
>    python -m venv venv && .\venv\Scripts\activate
>    pip install -r requirements.txt
>    cd db && python seed.py && cd ..
>    python main.py  # Runs on port 8000
>    
>    # 4. Set up frontend (new terminal)
>    cd frontend
>    npm install
>    npm run dev  # Runs on port 3000
>    ```
> 8. **Demo**: Link to YouTube video
> 9. **Project Structure**: tree view of the repo
> 10. **License**: MIT

---

### 📝 Step 10.2 — Demo Script (for your video)

Follow this exact script when recording:

**Setup:** Have both backend and frontend running. Open the browser to the dashboard.

**[0:00-0:30] The Problem & Solution**
- Show the dashboard with all 3 projects, cost charts, one budget alert card glowing red
- Voice: "Cloud costs are unpredictable. Finance can't see what's happening, engineering is reactive. CloudMind is a multi-agent AI FinOps platform built on Google ADK that acts as your 24/7 FinOps team."

**[0:30-1:30] The Agent Moment**
- Navigate to Chat
- Type: "Why did our production costs spike recently and what should we do about it?"
- Show the agent activity panel lighting up:
  - Anomaly Detection working... → "Detected 340% spike on June 10"
  - RightSizing working... → "Found over-provisioned VMs"
  - Report Agent generating summary
- Show the synthesized response with specific dollar amounts

**[1:30-2:15] Reports & Security**
- Navigate to Reports → Generate CFO Report → Show clean executive summary
- Switch to Engineering Report → Show detailed resource IDs and gcloud commands
- Voice: "Same data, two audiences — the Report Agent adapts its output based on who's reading."

**[2:15-2:45] Audit Log & RBAC**
- Navigate to Audit Log → Show entries with timestamps, agent names, and ALLOWED/DENIED status
- Point out a DENIED entry: "The Cost Analysis agent tried to flag a resource but was denied — it only has READ permissions. Our MCP server enforces tool-level RBAC via ADK's before_tool_callback."

**[2:45-3:00] Close**
- Voice: "CloudMind demonstrates 6 ADK concepts — multi-agent orchestration, custom MCP server, agent skills, callbacks and guardrails, security, and shared state — all on Google's ADK with Gemini 2.5 Flash."

### 🎬 Step 10.3 — Record the Video

Use **OBS Studio** (free) or Windows Game Bar (Win+G):
1. Set resolution to 1920×1080
2. Record the screen with microphone audio
3. Follow the demo script above
4. Keep it under 3 minutes
5. Upload to YouTube as **Unlisted**
6. Copy the YouTube link

### 📝 Step 10.4 — Kaggle Writeup

> **PROMPT 10B: Write the Kaggle Submission Description**
>
> Write a Kaggle writeup for CloudMind with exactly this structure (under 1500 words):
>
> **Title:** CloudMind: AI-Native FinOps Team Built on Google ADK
>
> **Problem:** Cloud cost management is broken. Organizations waste 30% of cloud spend on unoptimized resources, but FinOps requires expertise most teams lack. Finance teams can't see what's happening, and engineering teams are reactive instead of proactive.
>
> **Solution:** CloudMind is a multi-agent AI platform built on Google ADK where 5 specialized agents collaborate autonomously to analyze, detect, optimize, forecast, and report on cloud costs — with full audit trails and role-based access control.
>
> **Innovation:** Unlike traditional FinOps dashboards, CloudMind lets non-technical stakeholders ask questions in natural language ("Why did our bill spike?") and receive audience-appropriate answers. A CFO gets dollar impact and risk levels; an engineer gets resource IDs and gcloud commands. The agents reason, delegate, and synthesize — they're not glorified API calls.
>
> **ADK Concepts Demonstrated (6):**
> 1. Multi-agent orchestration — root orchestrator + 5 sub_agents using ADK's native pattern
> 2. Custom MCP Server — standalone fastmcp server with 8 tools serving billing, utilization, inventory, and audit data
> 3. Agent Skills — typed, reusable tool functions with ToolContext integration
> 4. Callbacks & Guardrails — before_tool_callback for RBAC enforcement, after_tool_callback for state updates and sanitization
> 5. Security — tool-level permission matrix, audit logging of every action including DENIED attempts
> 6. Shared State — ToolContext.state for cross-agent memory (anomaly findings available to report agent without re-querying)
>
> **Architecture:** [Include the ASCII diagram]
>
> **Business Impact:** CloudMind identifies 20-35% cost reduction opportunities through rightsizing recommendations, zombie resource detection, and anomaly alerting.
>
> **Tech Stack:** Google ADK, Gemini 2.5 Flash, fastmcp, FastAPI, Next.js, SQLite, Recharts
>
> **Links:**
> - GitHub: [link]
> - Video Demo: [YouTube link]
> - Built using vibe coding with AI-assisted development

---

### 📝 Step 10.5 — Submission Checklist

Before submitting on Kaggle:

- [ ] GitHub repo is **public**
- [ ] `.env` is NOT in the repo (check .gitignore works)
- [ ] `README.md` has clear setup instructions
- [ ] Video is uploaded to YouTube (unlisted)
- [ ] Video is under 3 minutes
- [ ] Kaggle writeup is written and reviewed
- [ ] All 4 submission components are ready:
  - [ ] Kaggle Writeup ✅
  - [ ] GitHub Link ✅
  - [ ] YouTube Video ✅
  - [ ] Project Link ✅

### Submit at: https://www.kaggle.com/competitions/vibecoding-agents-capstone-project

**DEADLINE: July 6, 2026, 11:59 PM PT**

---

<a id="reference"></a>
## 📚 MASTER REFERENCE — DATA CONTRACTS

### MCP Tool Signatures
| Tool Name | Parameters | Returns | Permission |
|---|---|---|---|
| `get_billing_data` | project_id, start_date, end_date | {records, total_cost} | READ |
| `get_cost_by_service` | project_id, start_date, end_date | {breakdown} | READ |
| `get_top_spending_resources` | project_id, limit | {resources} | READ |
| `compare_period_costs` | project_id, period_a_start/end, period_b_start/end | {period_a_cost, period_b_cost, difference, change_pct} | READ |
| `get_utilization_metrics` | resource_id, weeks | {resource_id, metrics, averages} | READ |
| `get_budget_config` | project_id | {monthly_budget, current_spend, ...} | READ |
| `get_resource_inventory` | project_id (optional) | {resources, total_count} | READ |
| `flag_resource_for_review` | resource_id, reason, flagged_by | {success, message} | WRITE |
| `write_audit_log` | agent_name, action, details, severity, resource_id, session_id | {success, log_id} | WRITE |
| `get_audit_logs` | limit, agent_name, severity | {logs, total_count} | READ |

### Agent → Tool Permission Matrix
| Agent | read billing | read util | read inventory | read budget | flag resource | write audit | read audit |
|---|---|---|---|---|---|---|---|
| cost_analysis | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| anomaly_detection | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| rightsizing | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| forecast | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| report | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/chat` | Non-streaming chat |
| POST | `/api/chat/stream` | SSE streaming chat |
| GET | `/api/reports/generate?audience=cfo&project_id=...` | Generate report |
| GET | `/api/reports/weekly` | Weekly digest |
| GET | `/api/alerts` | Agent-powered alert scan |
| GET | `/api/alerts/quick` | Quick budget alerts (no agent) |
| GET | `/api/forecast/{project_id}?horizon_days=30` | Spend forecast |
| GET | `/api/audit-log?limit=50&agent_name=...` | Audit log entries |
| GET | `/api/dashboard/summary` | Dashboard data (no agent) |

### Shared State Keys (ToolContext.state)
| Key | Set By | Read By | Content |
|---|---|---|---|
| `current_agent_name` | callbacks | callbacks | String: active agent name |
| `findings:cost_analysis:latest` | cost_analysis | report | Cost breakdown data |
| `findings:anomaly_detection:latest` | anomaly_detection | report, orchestrator | List of anomalies |
| `findings:rightsizing:latest` | rightsizing | report | Recommendations + savings |
| `findings:forecast:latest` | forecast | report | Forecast + risk level |
| `findings:report:latest` | report | orchestrator | Generated report content |
| `agent_results:{agent_name}` | after_callback | any agent | Last 5 tool results |

---

## ⚠️ COMMON PITFALLS TO AVOID

1. **Don't use `gemini-1.5-flash`** — it's been shut down. Use `gemini-2.5-flash`.
2. **Don't wrap agents as tools** — use ADK's native `sub_agents` parameter.
3. **Don't skip the video** — it's a mandatory submission requirement, not optional.
4. **Don't commit your `.env` file** — double-check .gitignore.
5. **Don't use print() in the MCP server** — it corrupts JSON-RPC communication. Use `logging` to stderr.
6. **Don't use complex ML for forecasting** — linear regression is fine. Judges score agent design, not your model.
7. **Don't hardcode the DB path** — use `os.path.dirname(os.path.abspath(__file__))` for relative paths.
8. **Test the demo flow 5+ times** before recording the video.
9. **Dates must be in 2026** — not 2025.
10. **Frontend and backend must both be running** for the demo.

---

*Built for Google ADK Capstone — Agents for Business Track*
*CloudMind: AI-native FinOps, running 24/7* ☁️🧠
