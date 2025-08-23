import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props, HeaderCredentials } from "./types";
import { registerAllTools } from "./tools/register-tools";
import { SITE_CREDENTIAL_HEADERS, RAMI_LEVY_CREDENTIAL_HEADERS, SHUFERSAL_CREDENTIAL_HEADERS } from "@shopping-copilot/shared";

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

// Extract site credentials from headers
function extractSiteCredentialsFromHeaders(request: Request): HeaderCredentials {
  const headers = extractHeaders(request);
  
  // Extract Rami Levy credentials
  const ramiLevyCredentials = {
    authorization: headers[RAMI_LEVY_CREDENTIAL_HEADERS.AUTHORIZATION],
    ecomtoken: headers[RAMI_LEVY_CREDENTIAL_HEADERS.ECOM_TOKEN],
    cookie: headers[RAMI_LEVY_CREDENTIAL_HEADERS.COOKIE],
    userId: headers[RAMI_LEVY_CREDENTIAL_HEADERS.USER_ID],
  };
  
  // Extract Shufersal credentials
  const shufersalCredentials = {
    csrftoken: headers[SHUFERSAL_CREDENTIAL_HEADERS.CSRF_TOKEN],
    cookie: headers[SHUFERSAL_CREDENTIAL_HEADERS.COOKIE],
  };
  
  // Get site name from header
  const siteName = headers[SITE_CREDENTIAL_HEADERS.SITE_NAME];
  
  return {
    siteName,
    ramiLevyCredentials: 
      ramiLevyCredentials.authorization && ramiLevyCredentials.ecomtoken && 
      ramiLevyCredentials.cookie && ramiLevyCredentials.userId 
        ? ramiLevyCredentials 
        : null,
    shufersalCredentials:
      shufersalCredentials.csrftoken && shufersalCredentials.cookie
        ? shufersalCredentials 
        : null,
  };
}

// Log headers for debugging
function logIncomingHeaders(request: Request, endpoint: string) {
  const headers = extractHeaders(request);
  const credentials = extractSiteCredentialsFromHeaders(request);
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Incoming request to ${endpoint}`);
  console.log(`[${timestamp}] Method: ${request.method}`);
  console.log(`[${timestamp}] Site: ${credentials.siteName || 'none'}`);
  console.log(`[${timestamp}] Has Rami Levy credentials: ${!!credentials.ramiLevyCredentials}`);
  console.log(`[${timestamp}] Has Shufersal credentials: ${!!credentials.shufersalCredentials}`);
  
  // Log all headers for debugging (but don't log credential values for security)
  const safeHeaders = { ...headers };
  Object.values(SITE_CREDENTIAL_HEADERS).forEach(headerName => {
    if (safeHeaders[headerName as string]) {
      safeHeaders[headerName as string] = '[REDACTED]';
    }
  });
  console.log(`[${timestamp}] Headers received:`, JSON.stringify(safeHeaders, null, 2));

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
