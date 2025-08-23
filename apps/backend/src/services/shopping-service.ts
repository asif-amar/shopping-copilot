import { ShoppingAdapterFactory } from "../shopping/factory";
import { ShoppingSecurity } from "../shopping/security";
import { 
  SiteAdapterNameValues, 
  SITE_CREDENTIAL_HEADERS,
  RAMI_LEVY_CREDENTIAL_HEADERS,
  SHUFERSAL_CREDENTIAL_HEADERS
} from "@shopping-copilot/shared";
import { HeaderCredentials } from "../types";

export class ShoppingService {
  
  /**
   * Extract site credentials from request headers
   */
  static extractCredentials(headers: Record<string, string>): HeaderCredentials {
    // Extract Rami Levy credentials
    const ramiLevyCredentials = {
      AUTHORIZATION: headers[RAMI_LEVY_CREDENTIAL_HEADERS.AUTHORIZATION],
      ECOM_TOKEN: headers[RAMI_LEVY_CREDENTIAL_HEADERS.ECOM_TOKEN],
      COOKIE: headers[RAMI_LEVY_CREDENTIAL_HEADERS.COOKIE],
      USER_ID: headers[RAMI_LEVY_CREDENTIAL_HEADERS.USER_ID],
    };
    
    // Extract Shufersal credentials
    const shufersalCredentials = {
      CSRF_TOKEN: headers[SHUFERSAL_CREDENTIAL_HEADERS.CSRF_TOKEN],
      COOKIE: headers[SHUFERSAL_CREDENTIAL_HEADERS.COOKIE],
    };
    
    // Get site name from header
    const siteName = headers[SITE_CREDENTIAL_HEADERS.SITE_NAME];
    
    return {
      siteName,
      ramiLevyCredentials: 
        ramiLevyCredentials.AUTHORIZATION && ramiLevyCredentials.ECOM_TOKEN && 
        ramiLevyCredentials.COOKIE && ramiLevyCredentials.USER_ID 
          ? ramiLevyCredentials 
          : null,
      shufersalCredentials:
        shufersalCredentials.CSRF_TOKEN && shufersalCredentials.COOKIE
          ? shufersalCredentials 
          : null,
    };
  }

  /**
   * Get credentials for a specific website from headers only
   */
  static getCredentialsForWebsite(
    website: SiteAdapterNameValues,
    headerCredentials?: HeaderCredentials
  ): { credentials: any; error: string | null } {
    if (!headerCredentials) {
      return {
        credentials: null,
        error: `Missing credentials for ${website}. Please provide credentials via request headers.`
      };
    }

    if (website === "rami-levy" && headerCredentials.ramiLevyCredentials) {
      return { credentials: headerCredentials.ramiLevyCredentials, error: null };
    } else if (website === "shufersal" && headerCredentials.shufersalCredentials) {
      return { credentials: headerCredentials.shufersalCredentials, error: null };
    }
    
    return {
      credentials: null,
      error: `Missing ${website} credentials. Please provide credentials via request headers.`
    };
  }

  /**
   * Search for products
   */
  static async searchProducts(
    website: SiteAdapterNameValues,
    query: string,
    category?: string,
    priceRange?: { min: number; max: number },
    headerCredentials?: HeaderCredentials
  ) {
    // Security validation
    const queryValidation = ShoppingSecurity.validateSearchQuery(query);
    if (!queryValidation.isValid) {
      throw new Error(queryValidation.error);
    }

    const categoryValidation = ShoppingSecurity.validateCategory(category);
    if (!categoryValidation.isValid) {
      throw new Error(categoryValidation.error);
    }

    const priceRangeValidation = ShoppingSecurity.validatePriceRange(priceRange);
    if (!priceRangeValidation.isValid) {
      throw new Error(priceRangeValidation.error);
    }

    // Get credentials
    const credentialsResult = this.getCredentialsForWebsite(website, headerCredentials);
    if (!credentialsResult.credentials) {
      throw new Error(credentialsResult.error!);
    }

    // Get adapter
    const adapter = ShoppingAdapterFactory.getAdapter(website, credentialsResult.credentials);

    // Execute search
    const result = await adapter.searchProducts({
      query: queryValidation.sanitized,
      category: categoryValidation.sanitized,
      priceRange,
    }, credentialsResult.credentials);

    if (!result.success) {
      throw new Error(ShoppingSecurity.formatSecureError(result.error || "Unknown error"));
    }

    return result.data;
  }

  /**
   * Add product to cart
   */
  static async addToCart(
    website: SiteAdapterNameValues,
    productId: string,
    quantity: number,
    variant?: string,
    headerCredentials?: HeaderCredentials
  ) {
    // Security validation
    const productIdValidation = ShoppingSecurity.validateProductId(productId, website);
    if (!productIdValidation.isValid) {
      throw new Error(productIdValidation.error);
    }

    const quantityValidation = ShoppingSecurity.validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      throw new Error(quantityValidation.error);
    }

    const variantValidation = ShoppingSecurity.validateVariant(variant);
    if (!variantValidation.isValid) {
      throw new Error(variantValidation.error);
    }

    // Get credentials
    const credentialsResult = this.getCredentialsForWebsite(website, headerCredentials);
    if (!credentialsResult.credentials) {
      throw new Error(credentialsResult.error!);
    }

    // Get adapter
    const adapter = ShoppingAdapterFactory.getAdapter(website, credentialsResult.credentials);

    // Add to cart
    const result = await adapter.addToCart(
      productId,
      quantity,
      credentialsResult.credentials,
      variantValidation.sanitized
    );

    if (!result.success) {
      throw new Error(ShoppingSecurity.formatSecureError(result.error || "Unknown error"));
    }

    return result.data;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(
    website: SiteAdapterNameValues,
    cartItemId: string,
    headerCredentials?: HeaderCredentials
  ) {
    // Security validation
    const cartItemValidation = ShoppingSecurity.validateCartItemId(cartItemId);
    if (!cartItemValidation.isValid) {
      throw new Error(cartItemValidation.error);
    }

    // Get credentials
    const credentialsResult = this.getCredentialsForWebsite(website, headerCredentials);
    if (!credentialsResult.credentials) {
      throw new Error(credentialsResult.error!);
    }

    // Get adapter
    const adapter = ShoppingAdapterFactory.getAdapter(website, credentialsResult.credentials);

    // Remove from cart
    const result = await adapter.removeFromCart(cartItemId, credentialsResult.credentials);

    if (!result.success) {
      throw new Error(ShoppingSecurity.formatSecureError(result.error || "Unknown error"));
    }

    return result.data;
  }

  /**
   * Update cart item quantity
   */
  static async updateCartQuantity(
    website: SiteAdapterNameValues,
    cartItemId: string,
    quantity: number,
    headerCredentials?: HeaderCredentials
  ) {
    // Security validation
    const cartItemValidation = ShoppingSecurity.validateCartItemId(cartItemId);
    if (!cartItemValidation.isValid) {
      throw new Error(cartItemValidation.error);
    }

    const quantityValidation = ShoppingSecurity.validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      throw new Error(quantityValidation.error);
    }

    // Get credentials
    const credentialsResult = this.getCredentialsForWebsite(website, headerCredentials);
    if (!credentialsResult.credentials) {
      throw new Error(credentialsResult.error!);
    }

    // Get adapter
    const adapter = ShoppingAdapterFactory.getAdapter(website, credentialsResult.credentials);

    // Update quantity
    const result = await adapter.updateCartQuantity(cartItemId, quantity, credentialsResult.credentials);

    if (!result.success) {
      throw new Error(ShoppingSecurity.formatSecureError(result.error || "Unknown error"));
    }

    return result.data;
  }

  /**
   * Get cart contents
   */
  static async getCartContents(
    website: SiteAdapterNameValues,
    headerCredentials?: HeaderCredentials
  ) {
    // Get credentials
    const credentialsResult = this.getCredentialsForWebsite(website, headerCredentials);
    if (!credentialsResult.credentials) {
      throw new Error(credentialsResult.error!);
    }

    // Get adapter
    const adapter = ShoppingAdapterFactory.getAdapter(website, credentialsResult.credentials);

    // Get cart contents
    const result = await adapter.getCartContents(credentialsResult.credentials);

    if (!result.success) {
      throw new Error(ShoppingSecurity.formatSecureError(result.error || "Unknown error"));
    }

    return result.data;
  }
}