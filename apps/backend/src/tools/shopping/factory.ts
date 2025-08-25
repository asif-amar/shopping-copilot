import { BaseShoppingAdapter } from "./adapters/base-adapter";
import { RamiLevyAdapter } from "./adapters/rami-levy-adapter";
import { ShufersalAdapter } from "./adapters/shufersal-adapter";
import { SiteAdapterNameValues, SiteAdapterName } from "@shopping-copilot/shared";
import { RamiLevyCredentials, ShufersalCredentials } from "./credential-types";

/**
 * Factory class for creating shopping website adapters
 * Handles routing operations to the correct website implementation
 */
export class ShoppingAdapterFactory {
  private static adapters: Map<SiteAdapterNameValues, BaseShoppingAdapter> =
    new Map();

  /**
   * Get or create an adapter for the specified website
   * Adapters are stateless and can be safely cached and reused
   * Credentials are passed per-method call, not stored in the adapter
   */
  static getAdapter(website: SiteAdapterNameValues, _credentials?: any, env?: any): BaseShoppingAdapter {
    // Check if adapter already exists
    if (this.adapters.has(website)) {
      const adapter = this.adapters.get(website)!;
      return adapter;
    }

    // Create new adapter based on website
    let adapter: BaseShoppingAdapter;

    try {
      switch (website) {
        case SiteAdapterName.ramiLevy:
          adapter = new RamiLevyAdapter();
          break;

        case SiteAdapterName.shufersal:
          adapter = new ShufersalAdapter();
          break;

        default:
          throw new Error(`Unsupported website: ${website}`);
      }

      // Cache the adapter for reuse (stateless adapters are safe to cache)
      this.adapters.set(website, adapter);
      return adapter;
    } catch (error) {
      throw new Error(
        `Failed to initialize ${website} adapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get list of supported websites
   */
  static getSupportedWebsites(): SiteAdapterNameValues[] {
    return [SiteAdapterName.ramiLevy, SiteAdapterName.shufersal];
  }

  /**
   * Check if a website is supported
   */
  static isWebsiteSupported(website: string): website is SiteAdapterNameValues {
    return this.getSupportedWebsites().includes(website as SiteAdapterNameValues);
  }

  /**
   * Clear cached adapters (useful for testing or credential updates)
   */
  static clearCache(): void {
    this.adapters.clear();
  }

  /**
   * Get Rami Levy credentials from environment
   */
  static getRamiLevyCredentials(env?: any): RamiLevyCredentials | null {
    if (!env) return null;

    const authorization = env.RAMI_LEVY_API_KEY;
    const ecomtoken = env.RAMI_LEVY_ECOM_TOKEN;
    const cookie = env.RAMI_LEVY_COOKIE;
    const userId = env.RAMI_LEVY_USER_ID;

    if (!authorization || !ecomtoken || !cookie || !userId) {
      return null;
    }

    return {
      authorization,
      ecomtoken,
      cookie,
      userId,
    };
  }

  /**
   * Get Shufersal credentials from environment
   */
  static getShufersalCredentials(env?: any): ShufersalCredentials | null {
    if (!env) return null;

    const csrftoken = env.SHUFERSAL_CSRF_TOKEN;
    const cookie = env.SHUFERSAL_COOKIE;

    if (!csrftoken || !cookie) {
      return null;
    }

    return {
      csrftoken,
      cookie,
    };
  }


  /**
   * Validate that all required environment variables are set for a website
   */
  static validateWebsiteConfig(
    website: SiteAdapterNameValues,
    env?: any
  ): { isValid: boolean; missingVars: string[] } {
    const missingVars: string[] = [];

    switch (website) {
      case SiteAdapterName.ramiLevy:
        if (!env || !env.RAMI_LEVY_API_KEY) {
          missingVars.push("RAMI_LEVY_API_KEY");
        }
        if (!env || !env.RAMI_LEVY_ECOM_TOKEN) {
          missingVars.push("RAMI_LEVY_ECOM_TOKEN");
        }
        if (!env || !env.RAMI_LEVY_COOKIE) {
          missingVars.push("RAMI_LEVY_COOKIE");
        }
        if (!env || !env.RAMI_LEVY_USER_ID) {
          missingVars.push("RAMI_LEVY_USER_ID");
        }
        break;

      case SiteAdapterName.shufersal:
        // Cart operations require authentication credentials
        if (!env || !env.SHUFERSAL_CSRF_TOKEN) {
          missingVars.push("SHUFERSAL_CSRF_TOKEN");
        }
        if (!env || !env.SHUFERSAL_COOKIE) {
          missingVars.push("SHUFERSAL_COOKIE");
        }
        break;

    }

    return {
      isValid: missingVars.length === 0,
      missingVars,
    };
  }

  /**
   * Get rate limit information for a website
   */
  static getRateLimit(website: SiteAdapterNameValues): number {
    try {
      const adapter = this.adapters.get(website);
      if (adapter) {
        return adapter.getRateLimit();
      }

      // Return default rate limits if adapter not initialized
      switch (website) {
        case SiteAdapterName.ramiLevy:
          return 60;
        case SiteAdapterName.shufersal:
          return 60;
        default:
          return 60;
      }
    } catch {
      return 60; // Default fallback
    }
  }
}