import {
  StreamRequest,
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
   * Send a message to the streaming endpoint with website context
   */
  static async sendMessage(
    content: string,
    hostname?: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers = await this.getHeaders(hostname);

    console.log("headers", headers);

    const response = await fetch(`${this.BASE_URL}/chat/agent`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: content,
        //Should be retreived by oauth
        user_id: "1",
      } as unknown as StreamRequest),
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
   * Parse a stream chunk into a message or shopping action
   */
  static parseStreamChunk(
    chunk: string
  ):
    | { type: "message"; content: string }
    | { type: "action"; data: ShoppingActionResponse }
    | null {
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          // Try to parse as JSON
          const parsed = JSON.parse(data);

          // Handle backend streaming format
          if (parsed.type === "response" && parsed.content) {
            return { type: "message", content: parsed.content };
          }

          if (parsed.type === "thinking" && parsed.content) {
            return { type: "message", content: parsed.content };
          }

          // Handle shopping action format
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
