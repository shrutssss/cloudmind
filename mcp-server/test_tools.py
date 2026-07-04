import json
from tools import billing, utilization, inventory, audit

class MockMCP:
    def __init__(self):
        self.tools = {}

    def tool(self):
        def decorator(func):
            self.tools[func.__name__] = func
            return func
        return decorator

mock_mcp = MockMCP()

# Register tools to capture their implementations
billing.register(mock_mcp)
utilization.register(mock_mcp)
inventory.register(mock_mcp)
audit.register(mock_mcp)

# Retrieve direct references to the inner tool functions
get_billing_data = mock_mcp.tools["get_billing_data"]
get_cost_by_service = mock_mcp.tools["get_cost_by_service"]
get_utilization_metrics = mock_mcp.tools["get_utilization_metrics"]
get_budget_config = mock_mcp.tools["get_budget_config"]
get_resource_inventory = mock_mcp.tools["get_resource_inventory"]
write_audit_log = mock_mcp.tools["write_audit_log"]
get_audit_logs = mock_mcp.tools["get_audit_logs"]

def print_result(name, result):
    print(f"=== {name} ===")
    print(json.dumps(result, indent=2))
    print("-" * 40)
    print()

if __name__ == "__main__":
    print("Starting direct local testing of MCP server tools...\n")
    
    # 1. get_billing_data
    print_result(
        "get_billing_data", 
        get_billing_data("proj-prod-ecommerce", "2026-06-01", "2026-06-15")
    )
    
    # 2. get_cost_by_service
    print_result(
        "get_cost_by_service", 
        get_cost_by_service("proj-prod-ecommerce", "2026-06-01", "2026-06-15")
    )
    
    # 3. get_utilization_metrics
    print_result(
        "get_utilization_metrics", 
        get_utilization_metrics("vm-prod-us-central1-001", 4)
    )
    
    # 4. get_budget_config
    print_result(
        "get_budget_config", 
        get_budget_config("proj-prod-ecommerce")
    )
    
    # 5. get_resource_inventory
    print_result(
        "get_resource_inventory", 
        get_resource_inventory("proj-prod-ecommerce")
    )
    
    # 6. write_audit_log
    print_result(
        "write_audit_log", 
        write_audit_log("test", "test_action", "Testing audit log", "INFO")
    )
    
    # 7. get_audit_logs
    print_result(
        "get_audit_logs", 
        get_audit_logs(10)
    )
