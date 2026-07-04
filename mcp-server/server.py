from fastmcp import FastMCP

from tools import audit, billing, inventory, utilization
from tools.db import DB_PATH

mcp = FastMCP("cloudmind-finops")

billing.register(mcp)
utilization.register(mcp)
inventory.register(mcp)
audit.register(mcp)

if __name__ == "__main__":
    mcp.run()
