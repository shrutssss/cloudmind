"""Seed CloudMind SQLite database from mock JSON data files."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent
DATA_DIR = DB_DIR.parent / "data"
DB_PATH = DB_DIR / "cloudmind.db"
SCHEMA_PATH = DB_DIR / "schema.sql"

DATA_FILES = {
    "billing_records": DATA_DIR / "billing_data.json",
    "resources": DATA_DIR / "resource_inventory.json",
    "utilization_metrics": DATA_DIR / "utilization_metrics.json",
    "budgets": DATA_DIR / "budgets.json",
}


def load_json(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def parse_billing_id(record_id: str) -> int:
    return int(record_id.removeprefix("bill-"))


def seed_billing_records(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany(
        """
        INSERT INTO billing_records (
            id, project_id, service, date, cost, region, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                parse_billing_id(record["id"]),
                record["project_id"],
                record["service"],
                record["date"],
                record["cost"],
                record["region"],
                json.dumps(record["tags"]),
            )
            for record in records
        ],
    )
    return len(records)


def seed_resources(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany(
        """
        INSERT INTO resources (
            id, resource_id, project_id, name, type, region, state,
            vcpus, memory_gb, monthly_cost, provisioned_date, labels
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                index,
                record["resource_id"],
                record["project_id"],
                record["name"],
                record["type"],
                record["region"],
                record["state"],
                record["vcpus"],
                record["memory_gb"],
                record["monthly_cost"],
                record["provisioned_date"],
                json.dumps(record["labels"]),
            )
            for index, record in enumerate(records, start=1)
        ],
    )
    return len(records)


def seed_utilization_metrics(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany(
        """
        INSERT INTO utilization_metrics (
            id, resource_id, period_start, period_end,
            avg_cpu_pct, max_cpu_pct, avg_memory_pct, max_memory_pct,
            avg_network_mbps
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                index,
                record["resource_id"],
                record["period_start"],
                record["period_end"],
                record["avg_cpu_pct"],
                record["max_cpu_pct"],
                record["avg_memory_pct"],
                record["max_memory_pct"],
                record["avg_network_mbps"],
            )
            for index, record in enumerate(records, start=1)
        ],
    )
    return len(records)


def seed_budgets(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany(
        """
        INSERT INTO budgets (
            id, project_id, monthly_budget, current_month_spend,
            budget_used_pct, alert_threshold_pct, alert_triggered
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                index,
                record["project_id"],
                record["monthly_budget"],
                record["current_month_spend"],
                record["budget_used_pct"],
                record["alert_threshold_pct"],
                int(record["alert_triggered"]),
            )
            for index, record in enumerate(records, start=1)
        ],
    )
    return len(records)


def main() -> None:
    for name, path in DATA_FILES.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing {name} data file: {path}")

    if DB_PATH.exists():
        DB_PATH.unlink()

    billing_data = load_json(DATA_FILES["billing_records"])
    resources_data = load_json(DATA_FILES["resources"])
    utilization_data = load_json(DATA_FILES["utilization_metrics"])
    budgets_data = load_json(DATA_FILES["budgets"])

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

        billing_count = seed_billing_records(conn, billing_data)
        resources_count = seed_resources(conn, resources_data)
        utilization_count = seed_utilization_metrics(conn, utilization_data)
        budgets_count = seed_budgets(conn, budgets_data)

        conn.commit()
    finally:
        conn.close()

    print(f"Inserted {billing_count} billing records")
    print(f"Inserted {resources_count} resources")
    print(f"Inserted {utilization_count} utilization metrics")
    print(f"Inserted {budgets_count} budgets")
    print(f"Database seeded successfully at {DB_PATH.name}")


if __name__ == "__main__":
    main()
