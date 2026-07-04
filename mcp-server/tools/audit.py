import json
from datetime import datetime, timezone

from tools.db import get_db_connection


def register(mcp):
    @mcp.tool()
    def write_audit_log(
        agent_name: str,
        action: str,
        details: str,
        severity: str = "INFO",
        resource_id: str = "",
        session_id: str = "",
    ) -> dict:
        """Logs an agent action to the audit trail. Every agent action should be logged.
        severity: one of INFO, WARNING, HIGH, CRITICAL
        Returns a dict with 'success', 'log_id'.
        """
        try:
            valid_severities = {"INFO", "WARNING", "HIGH", "CRITICAL"}
            if severity not in valid_severities:
                return {
                    "error": f"Invalid severity '{severity}'. Must be one of: {', '.join(sorted(valid_severities))}"
                }

            conn = get_db_connection()
            try:
                timestamp = datetime.now(timezone.utc).isoformat()
                details_json = json.dumps({"message": details})

                cursor = conn.execute(
                    """
                    INSERT INTO audit_log (
                        timestamp, agent_name, action, resource_id,
                        details, severity, session_id, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        timestamp,
                        agent_name,
                        action,
                        resource_id or None,
                        details_json,
                        severity,
                        session_id or None,
                        "ALLOWED",
                    ),
                )
                conn.commit()

                return {"success": True, "log_id": cursor.lastrowid}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def get_audit_logs(
        limit: int = 50, agent_name: str = "", severity: str = ""
    ) -> dict:
        """Retrieves recent audit log entries, optionally filtered.
        Returns a dict with 'logs' (list) and 'total_count'.
        """
        try:
            conn = get_db_connection()
            try:
                query = """
                    SELECT id, timestamp, agent_name, action, resource_id,
                           details, severity, session_id, status
                    FROM audit_log
                    WHERE 1=1
                """
                params: list = []

                if agent_name:
                    query += " AND agent_name = ?"
                    params.append(agent_name)
                if severity:
                    query += " AND severity = ?"
                    params.append(severity)

                query += " ORDER BY id DESC LIMIT ?"
                params.append(limit)

                rows = conn.execute(query, params).fetchall()

                logs = []
                for row in rows:
                    entry = dict(row)
                    entry["details"] = json.loads(entry["details"])
                    logs.append(entry)

                count_query = "SELECT COUNT(*) AS total FROM audit_log WHERE 1=1"
                count_params: list = []
                if agent_name:
                    count_query += " AND agent_name = ?"
                    count_params.append(agent_name)
                if severity:
                    count_query += " AND severity = ?"
                    count_params.append(severity)

                total_count = conn.execute(count_query, count_params).fetchone()[
                    "total"
                ]

                return {"logs": logs, "total_count": total_count}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}
