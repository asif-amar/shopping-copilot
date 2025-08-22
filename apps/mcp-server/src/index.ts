import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "./types";
import { registerAllTools } from "./tools/register-tools";

export class ShoppingMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "Shopping MCP Server",
    version: "1.0.0",
  });

  /**
   * Cleanup resources when Durable Object is shutting down
   */
  async cleanup(): Promise<void> {
    try {
      console.log("Shopping MCP server cleanup completed");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  /**
   * Durable Objects alarm handler - used for cleanup
   */
  async alarm(): Promise<void> {
    await this.cleanup();
  }

  async init() {
    // Register all tools based on user permissions
    registerAllTools(this.server, this.env, this.props);
  }
}

// Header extraction utility
function extractHeaders(request: Request) {
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }
  return headers;
}

// Log headers for debugging
function logIncomingHeaders(request: Request, endpoint: string) {
  const headers = extractHeaders(request);
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Incoming request to ${endpoint}`);
  console.log(`[${timestamp}] Method: ${request.method}`);
  console.log(
    `[${timestamp}] Headers received:`,
    JSON.stringify(headers, null, 2)
  );

  // Specifically check for our test header
  if (headers["test-header"]) {
    console.log(
      `[${timestamp}] ✅ TEST-HEADER FOUND: ${headers["test-header"]}`
    );
  } else {
    console.log(`[${timestamp}] ❌ test-header not found in request`);
  }

  return headers;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Support both SSE (legacy) and MCP (modern) transports
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      logIncomingHeaders(request, "/sse");
      return ShoppingMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      logIncomingHeaders(request, "/mcp");
      return ShoppingMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      logIncomingHeaders(request, "/health");
      return new Response("OK", { status: 200 });
    }

    // Default response for root
    logIncomingHeaders(request, "root");
    return new Response(
      "Shopping MCP Server\n\nEndpoints:\n- /mcp (recommended)\n- /sse (legacy)\n- /health",
      {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }
    );
  },
};
