CREATE TABLE IF NOT EXISTS billing_records (
    id INTEGER PRIMARY KEY,
    project_id TEXT NOT NULL,
    service TEXT NOT NULL,
    date TEXT NOT NULL,
    cost REAL NOT NULL,
    region TEXT NOT NULL,
    tags TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY,
    resource_id TEXT NOT NULL UNIQUE,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT NOT NULL,
    state TEXT NOT NULL,
    vcpus INTEGER NOT NULL,
    memory_gb REAL NOT NULL,
    monthly_cost REAL NOT NULL,
    provisioned_date TEXT NOT NULL,
    labels TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS utilization_metrics (
    id INTEGER PRIMARY KEY,
    resource_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    avg_cpu_pct REAL NOT NULL,
    max_cpu_pct REAL NOT NULL,
    avg_memory_pct REAL NOT NULL,
    max_memory_pct REAL NOT NULL,
    avg_network_mbps REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    monthly_budget REAL NOT NULL,
    current_month_spend REAL NOT NULL,
    budget_used_pct REAL NOT NULL,
    alert_threshold_pct REAL NOT NULL,
    alert_triggered INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_id TEXT,
    details TEXT NOT NULL,
    severity TEXT NOT NULL,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'ALLOWED'
);
