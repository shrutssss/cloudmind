import json
from datetime import datetime, timezone

from tools.db import get_db_connection


def register(mcp):
    @mcp.tool()
    def get_resource_inventory(project_id: str = "") -> dict:
        """Returns all provisioned resources, optionally filtered by project.
        If project_id is empty, returns all resources.
        Returns a dict with 'resources' (list) and 'total_count'.
        """
        try:
            conn = get_db_connection()
            try:
                if project_id:
                    rows = conn.execute(
                        """
                        SELECT resource_id, project_id, name, type, region, state,
                               vcpus, memory_gb, monthly_cost, provisioned_date, labels
                        FROM resources
                        WHERE project_id = ?
                        ORDER BY monthly_cost DESC
                        """,
                        (project_id,),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT resource_id, project_id, name, type, region, state,
                               vcpus, memory_gb, monthly_cost, provisioned_date, labels
                        FROM resources
                        ORDER BY project_id, monthly_cost DESC
                        """
                    ).fetchall()

                resources = []
                for row in rows:
                    resource = dict(row)
                    resource["labels"] = json.loads(resource["labels"])
                    resources.append(resource)

                return {"resources": resources, "total_count": len(resources)}
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}

    @mcp.tool()
    def flag_resource_for_review(
        resource_id: str, reason: str, flagged_by: str
    ) -> dict:
        """Marks a resource for human review. This is a WRITE operation that requires
        elevated permissions. Inserts an audit log entry.
        Returns a dict with 'success', 'message'.
        """
        try:
            conn = get_db_connection()
            try:
                resource = conn.execute(
                    "SELECT resource_id, name FROM resources WHERE resource_id = ?",
                    (resource_id,),
                ).fetchone()

                if resource is None:
                    return {"error": f"Resource '{resource_id}' not found"}

                timestamp = datetime.now(timezone.utc).isoformat()
                details = json.dumps(
                    {
                        "reason": reason,
                        "flagged_by": flagged_by,
                        "resource_name": resource["name"],
                    }
                )

                conn.execute(
                    """
                    INSERT INTO audit_log (
                        timestamp, agent_name, action, resource_id,
                        details, severity, session_id, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        timestamp,
                        flagged_by,
                        "FLAG_FOR_REVIEW",
                        resource_id,
                        details,
                        "WARNING",
                        "",
                        "ALLOWED",
                    ),
                )
                conn.commit()

                return {
                    "success": True,
                    "message": f"Resource '{resource_id}' flagged for review",
                }
            finally:
                conn.close()
        except Exception as exc:
            return {"error": str(exc)}
