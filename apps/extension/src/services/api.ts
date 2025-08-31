import {
  SITE_CREDENTIAL_HEADERS,
  mapCredentialsToHeaders,
  RamiLevyHeaders,
  ShufersalHeaders,
} from "@shopping-copilot/shared";
import { BACKEND_URL } from "@/utils/constants";
import { getSiteAdapterFromHostname } from "./websiteContext";
import { CredentialExtractor } from "./credentialExtractor";

export type ShoppingActionResponse = {
  success: boolean;
  action: string;
  actionDescription: string;
  website: string;
  data?: any;
  error?: string;
};

export class ApiService {
  private static readonly BASE_URL = BACKEND_URL;

  /**
   * Get headers with website context and credentials
   */
  private static async getHeaders(
    hostname?: string
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If no hostname provided, try to get current one
    if (!hostname) {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab.url) {
          const url = new URL(tab.url);
          hostname = url.hostname;
        }
      } catch (error) {
        return headers;
      }
    }

    if (!hostname) {
      return headers;
    }

    // Get site adapter from hostname
    const siteAdapter = getSiteAdapterFromHostname(hostname);

    if (!siteAdapter) {
      return headers;
    }

    // Set site name header
    headers[SITE_CREDENTIAL_HEADERS.SITE_NAME] = siteAdapter;

    // Extract and set credentials based on site
    try {
      const credentials =
        await CredentialExtractor.extractCredentialsForSite(siteAdapter);

      console.log("credentialscredentials", credentials);

      if (credentials) {
        // Debug the mapping process
        console.log("🔍 Debug mapping:", {
          siteAdapter,
          credentials,
          credentialKeys: Object.keys(credentials),
        });

        // Convert credentials to the format expected by mapCredentialsToHeaders
        // The shared package expects lowercase keys but our credentials have uppercase keys
        let normalizedCredentials: any = {};

        if (siteAdapter === "rami-levy") {
          // Map uppercase credential keys to lowercase header keys
          const ramiCredentials = credentials as RamiLevyHeaders;
          normalizedCredentials = {
            authorization: ramiCredentials.AUTHORIZATION.replace(
              /^Bearer\s+/i,
              ""
            ),
            cookie: ramiCredentials.COOKIE,
            ecomtoken: ramiCredentials.ECOM_TOKEN,
            userId: ramiCredentials.USER_ID || "1",
          };
        } else if (siteAdapter === "shufersal") {
          // Map for Shufersal if needed
          const shufersalCredentials = credentials as ShufersalHeaders;
          normalizedCredentials = {
            "x-csrf-token": shufersalCredentials.CSRF_TOKEN,
            cookie: shufersalCredentials.COOKIE,
          };
        }

        console.log("🔧 Normalized credentials:", normalizedCredentials);

        // Use the scalable mapping function
        const mappedHeaders = mapCredentialsToHeaders(
          siteAdapter,
          normalizedCredentials
        );
        console.log("mappedHeaders", mappedHeaders);

        Object.assign(headers, mappedHeaders);
      }
    } catch (error) {
      // Failed to extract credentials
    }

    return headers;
  }

  /**
   * Send a message to the conversation endpoint with website context
   */
  static async sendMessage(
    content: string,
    conversationId?: string,
    hostname?: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers = await this.getHeaders(hostname);

    console.log("headers", headers);

    const response = await fetch(`${this.BASE_URL}/conversation`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: content,
        conversation_id: conversationId,
        user_id: "1",
        hostname: hostname,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    return reader;
  }

  /**
   * Get a conversation by ID
   */
  static async getConversation(conversationId: string, userId: string = "1") {
    const response = await fetch(`${this.BASE_URL}/conversation/${conversationId}?user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * List all conversations for a user
   */
  static async listConversations(userId: string = "1", limit: number = 50) {
    const response = await fetch(`${this.BASE_URL}/conversations?user_id=${userId}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Parse a stream chunk into various response types
   */
  static parseStreamChunk(
    chunk: string
  ):
    | { type: "message"; content: string }
    | { type: "action"; data: ShoppingActionResponse }
    | { type: "conversation_info"; conversationId: string; hostname: string }
    | { type: "complete"; conversationId: string }
    | { type: "thinking"; content: string }
    | { type: "tool"; content: string }
    | { type: "product_start" }
    | { type: "product"; product: any }
    | { type: "product_end" }
    | { type: "error"; message: string }
    | null {
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          // Try to parse as JSON
          const parsed = JSON.parse(data);

          // Handle new backend streaming format
          if (parsed.type === "conversation_info") {
            return { 
              type: "conversation_info", 
              conversationId: parsed.conversation_id,
              hostname: parsed.hostname 
            };
          }

          if (parsed.type === "complete") {
            return { type: "complete", conversationId: parsed.conversation_id };
          }

          if (parsed.type === "thinking" && parsed.content) {
            return { type: "thinking", content: parsed.content };
          }

          if (parsed.type === "tool" && parsed.content) {
            return { type: "tool", content: parsed.content };
          }

          if (parsed.type === "response" && parsed.content) {
            return { type: "message", content: parsed.content };
          }

          if (parsed.type === "product_start") {
            return { type: "product_start" };
          }

          if (parsed.type === "product" && parsed.product) {
            return { type: "product", product: parsed.product };
          }

          if (parsed.type === "product_end") {
            return { type: "product_end" };
          }

          if (parsed.type === "error") {
            return { type: "error", message: parsed.message };
          }

          // Handle shopping action format (legacy)
          if (parsed.action) {
            return { type: "action", data: parsed };
          }

          // Handle OpenAI format (fallback)
          if (parsed.choices?.[0]?.delta?.content) {
            return {
              type: "message",
              content: parsed.choices[0].delta.content,
            };
          }
        } catch (e) {
          // If parsing fails, treat as plain text message
          return { type: "message", content: data };
        }
      }
    }
    return null;
  }
}
