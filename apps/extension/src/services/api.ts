import {
  SITE_CREDENTIAL_HEADERS,
  mapCredentialsToHeaders,
  RamiLevyHeaders,
  ShufersalHeaders,
} from "@shopping-copilot/shared";
import { BACKEND_URL } from "@/utils/constants";
import { getSiteAdapterFromHostname } from "./websiteContext";
import { CredentialExtractor } from "./credentialExtractor";
import { UserPreferences } from "@/types/preferences";

export type ShoppingActionResponse = {
  success: boolean;
  action: string;
  actionDescription: string;
  website: string;
  data?: any;
  error?: string;
};

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  profile_picture_url?: string | null;
}

export interface FeedbackSubmission {
  type: "bug" | "feature" | "general" | "improvement";
  subject: string;
  message: string;
}

export interface FeedbackResponse {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface CreditStatus {
  credits_remaining: number;
  credits_total_monthly: number;
  credits_reset_date: string | null;
  plan_type: string;
  is_low_credits: boolean;
  credits_exhausted: boolean;
  reset_due: boolean;
}

export interface CreditTransaction {
  id: number;
  credit_change: number;
  credits_before: number;
  credits_after: number;
  reason: string;
  conversation_id: string | null;
  description: string | null;
  created_at: string;
}

export interface CreditHistory {
  transactions: CreditTransaction[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface UserPreferencesData {
  id: string;
  user_id: string;
  household_size?: string;
  dietary_restrictions: string[];
  budget_preference?: string;
  primary_sites: string[];
  shopping_frequency?: string;
  language_preference: string;
  preferred_categories: string[];
  brand_preferences: string[];
  special_considerations: string[];
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingRequest {
  household_size?: string;
  dietary_restrictions?: string[];
  budget_preference?: string;
  primary_sites?: string[];
  shopping_frequency?: string;
  language_preference?: string;
  preferred_categories?: string[];
  brand_preferences?: string[];
  special_considerations?: string[];
}

export interface OnboardingStatus {
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  preferences_exist: boolean;
}

export class ApiService {
  private static readonly BASE_URL = BACKEND_URL;

  /**
   * Get stored auth token
   */
  private static async getAuthToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["authToken"], (result) => {
        resolve(result.authToken || null);
      });
    });
  }

  /**
   * Get headers with website context and credentials
   */
  private static async getHeaders(
    hostname?: string
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication header if token exists
    const authToken = await this.getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

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

      if (credentials) {
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

        // Use the scalable mapping function
        const mappedHeaders = mapCredentialsToHeaders(
          siteAdapter,
          normalizedCredentials
        );

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
    hostname?: string,
    preferences?: UserPreferences
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers = await this.getHeaders(hostname);

    const response = await fetch(`${this.BASE_URL}/conversation`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: content,
        conversation_id: conversationId,
        user_id: "1",
        hostname: hostname,
        preferences: preferences,
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
  static async getConversation(conversationId: string) {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${this.BASE_URL}/conversation/${conversationId}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * List all conversations for the authenticated user
   */
  static async listConversations(limit: number = 50) {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${this.BASE_URL}/conversations?limit=${limit}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Authenticate with Google OAuth token
   */
  static async authenticateWithGoogle(
    googleToken: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${this.BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: googleToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Authentication failed! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Clear cached Google tokens to force account selection
   */
  static async clearGoogleTokens(): Promise<void> {
    return new Promise((resolve) => {
      // Get any cached token without user interaction
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          console.log(
            "Found cached token, removing it:",
            token.substring(0, 20) + "..."
          );
          // Remove the cached token
          chrome.identity.removeCachedAuthToken({ token }, () => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Error removing cached token:",
                chrome.runtime.lastError
              );
            } else {
              console.log("Cached Google token cleared");
            }
            // Also try to clear the profile info cache
            chrome.identity.clearAllCachedAuthTokens(() => {
              if (chrome.runtime.lastError) {
                console.warn(
                  "Error clearing all cached tokens:",
                  chrome.runtime.lastError
                );
              } else {
                console.log("All cached Google tokens cleared");
              }
              resolve();
            });
          });
        } else {
          // No token to clear, but still try to clear all cached tokens
          chrome.identity.clearAllCachedAuthTokens(() => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Error clearing all cached tokens:",
                chrome.runtime.lastError
              );
            } else {
              console.log(
                "All cached Google tokens cleared (no specific token found)"
              );
            }
            resolve();
          });
        }
      });
    });
  }

  /**
   * Sign in with Google using Chrome Identity API
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // First clear any cached tokens to force account selection
        await this.clearGoogleTokens();
      } catch (error) {
        console.warn("Could not clear cached tokens:", error);
        // Continue anyway
      }

      // Add a small delay to ensure token clearing takes effect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get Google Access Token from Chrome's Identity API
      // Use getAuthToken with explicit account selection
      chrome.identity.getAuthToken(
        {
          interactive: true,
          account: { id: "" }, // Force account selection by using empty account ID
        },
        async (googleToken) => {
          if (chrome.runtime.lastError || !googleToken) {
            console.error(
              "Could not get Google token:",
              chrome.runtime.lastError
            );
            reject(new Error("Could not get Google token"));
            return;
          }

          try {
            // Send the token to the backend
            const authResponse = await this.authenticateWithGoogle(googleToken);

            // Store the backend's JWT securely
            await chrome.storage.local.set({
              authToken: authResponse.access_token,
            });
            console.log("Successfully logged in!");

            resolve(authResponse);
          } catch (error) {
            console.error("Error authenticating with backend:", error);
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Call backend logout endpoint to invalidate JWT
   */
  static async logoutFromBackend(): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await fetch(`${this.BASE_URL}/auth/logout`, {
        method: "POST",
        headers,
      });

      // Logout result handled silently
    } catch (error) {
      console.warn(
        "Error calling backend logout:",
        error,
        "- continuing with client-side cleanup"
      );
    }
  }

  /**
   * Sign out user by clearing stored token and revoking Google's token
   */
  static async signOut(): Promise<void> {
    return new Promise((resolve) => {
      // Helper function to clear our JWT token
      const clearOurToken = () => {
        chrome.storage.local.remove(["authToken"], () => {
          console.log("User signed out - all tokens cleared");
          resolve();
        });
      };

      // Helper function to handle Google token cleanup
      const cleanupGoogleToken = async () => {
        // First, get the current Google access token
        chrome.identity.getAuthToken({ interactive: false }, (currentToken) => {
          if (chrome.runtime.lastError || !currentToken) {
            console.error(
              "Could not get current token to clear:",
              chrome.runtime.lastError
            );
            // Even if this fails, we should still clear our own token
            clearOurToken();
            return;
          }

          // Revoke the Google token using the correct accounts URL
          fetch(
            `https://accounts.google.com/o/oauth2/revoke?token=${currentToken}`
          )
            .then(() => {
              // Remove the token from Chrome's cache
              chrome.identity.removeCachedAuthToken(
                { token: currentToken },
                () => {
                  // Finally, remove our backend's token from storage
                  clearOurToken();
                }
              );
            })
            .catch((error) => {
              console.error("Error revoking Google token:", error);
              // Still try to remove from cache even if revocation fails
              chrome.identity.removeCachedAuthToken(
                { token: currentToken },
                () => {
                  clearOurToken();
                }
              );
            });
        });
      };

      // First, try to logout from backend, then cleanup tokens
      this.logoutFromBackend().finally(() => {
        // Always cleanup Google tokens regardless of backend logout result
        cleanupGoogleToken();
      });
    });
  }

  /**
   * Get current user info from stored token (basic decode)
   */
  static async getCurrentUserInfo(): Promise<{ email: string } | null> {
    const token = await this.getAuthToken();
    if (!token) return null;

    try {
      // Basic JWT decode (payload only, no verification)
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        email: payload.email || payload.sub,
      };
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }

  /**
   * Get user profile from backend
   */
  static async getUserProfile(): Promise<UserProfile> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/me`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to get user profile! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    updates: UserProfileUpdate
  ): Promise<UserProfile> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail ||
          `Failed to update user profile! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Submit user feedback
   */
  static async submitFeedback(
    feedback: FeedbackSubmission
  ): Promise<FeedbackResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/feedback/`, {
      method: "POST",
      headers,
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to submit feedback! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get user credit status
   */
  static async getUserCredits(): Promise<CreditStatus> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/credits`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to get user credits! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get user credit history
   */
  static async getCreditHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<CreditHistory> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${this.BASE_URL}/user/credit-history?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail ||
          `Failed to get credit history! status: ${response.status}`
      );
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
    | { type: "user_message"; content: string }
    | { type: "response"; content: string }
    | { type: "action"; data: ShoppingActionResponse }
    | { type: "conversation_info"; conversationId: string; hostname: string }
    | {
        type: "complete";
        conversationId: string;
        credits_remaining?: number;
        is_low_credits?: boolean;
        credits_exhausted?: boolean;
      }
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
              hostname: parsed.hostname,
            };
          }

          if (parsed.type === "complete") {
            return {
              type: "complete",
              conversationId: parsed.conversation_id,
              credits_remaining: parsed.credits_remaining,
              is_low_credits: parsed.is_low_credits,
              credits_exhausted: parsed.credits_exhausted,
            };
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

          if (parsed.type === "user_message" && parsed.content) {
            return { type: "user_message", content: parsed.content };
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

  /**
   * Get user preferences and onboarding data
   */
  static async getUserPreferences(): Promise<UserPreferencesData> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/preferences`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to get user preferences! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    preferences: Partial<OnboardingRequest>
  ): Promise<UserPreferencesData> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/preferences`, {
      method: "PUT",
      headers,
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to update user preferences! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Complete user onboarding with collected data
   */
  static async completeOnboarding(
    onboardingData: OnboardingRequest
  ): Promise<UserPreferencesData> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/onboarding`, {
      method: "POST",
      headers,
      body: JSON.stringify(onboardingData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to complete onboarding! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get user onboarding completion status
   */
  static async getOnboardingStatus(): Promise<OnboardingStatus> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.BASE_URL}/user/onboarding-status`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Failed to get onboarding status! status: ${response.status}`
      );
    }

    return response.json();
  }
}
