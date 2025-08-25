import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { registerShoppingTools } from "./shopping-tools";

/**
 * Register all MCP tools based on user permissions and request headers
 */
export function registerAllTools(server: McpServer, env: Env, props: Props) {
  // Access request headers/credentials
  const credentials = props.headerCredentials;
  
  if (credentials) {
    console.log("=== MCP Request Headers Available ===");
    console.log("Site name:", credentials.siteName);
    console.log("Has Rami Levy credentials:", !!credentials.ramiLevyCredentials);
    console.log("Has Shufersal credentials:", !!credentials.shufersalCredentials);
    
    // Access specific Rami Levy credentials if available
    if (credentials.ramiLevyCredentials) {
      const { authorization, ecomtoken, cookie, userId } = credentials.ramiLevyCredentials;
      console.log("Rami Levy auth header:", authorization ? "[PRESENT]" : "[MISSING]");
      console.log("Rami Levy ecom token:", ecomtoken ? "[PRESENT]" : "[MISSING]");
      console.log("Rami Levy cookie:", cookie ? "[PRESENT]" : "[MISSING]");
      console.log("Rami Levy user ID:", userId ? "[PRESENT]" : "[MISSING]");
    }
    
    // Access specific Shufersal credentials if available
    if (credentials.shufersalCredentials) {
      const { csrftoken, cookie } = credentials.shufersalCredentials;
      console.log("Shufersal CSRF token:", csrftoken ? "[PRESENT]" : "[MISSING]");
      console.log("Shufersal cookie:", cookie ? "[PRESENT]" : "[MISSING]");
    }
  } else {
    console.log("=== No MCP Request Headers Available ===");
  }

  // Register shopping tools with credentials available in props
  registerShoppingTools(server, env, props);

  console.log("=== MCP Tools Registered Successfully ===");
  console.log("Environment variables available:", Object.keys(env || {}).length);
  console.log("Props available:", Object.keys(props || {}).length);

  // Future tools can be registered here with access to headers
  // registerOrderTools(server, env, props);
  // registerPaymentTools(server, env, props);
}
