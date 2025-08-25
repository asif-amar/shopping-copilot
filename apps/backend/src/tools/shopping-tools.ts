import { tool } from "ai";
import { z } from "zod";
import {
  SiteAdapterName,
  SiteAdapterNameValues,
} from "@shopping-copilot/shared";
import { ShoppingAdapterFactory } from "./shopping/factory";
import { ShoppingSecurity } from "./shopping/security";

// Define types for tool inputSchema
type SearchProductsParams = {
  website: SiteAdapterNameValues;
  query: string;
  category?: string;
  priceRange?: { min: number; max: number };
  credentials?: any;
};

type AddToCartParams = {
  website: SiteAdapterNameValues;
  productId: string;
  quantity: number;
  variant?: string;
  credentials?: any;
};

type RemoveFromCartParams = {
  website: SiteAdapterNameValues;
  cartItemId: string;
  credentials?: any;
};

type UpdateCartQuantityParams = {
  website: SiteAdapterNameValues;
  cartItemId: string;
  quantity: number;
  credentials?: any;
};

type GetCartContentsParams = {
  website: SiteAdapterNameValues;
  credentials?: any;
};

// Helper function to get credentials for a website
function getCredentialsForWebsite(
  website: SiteAdapterNameValues,
  credentials?: any
) {
  if (!credentials) {
    return {
      credentials: null,
      error: `Missing credentials for ${website}. Please provide credentials in the request.`,
    };
  }

  // Get adapter-specific credentials from the passed credentials object
  if (website === "rami-levy") {
    const ramiLevyCredentials = {
      authorization: credentials.authorization,
      ecomtoken: credentials.ecomtoken,
      cookie: credentials.cookie,
      userId: credentials.userId,
    };

    // Check if all required credentials are present
    if (
      !ramiLevyCredentials.authorization ||
      !ramiLevyCredentials.ecomtoken ||
      !ramiLevyCredentials.cookie ||
      !ramiLevyCredentials.userId
    ) {
      return {
        credentials: null,
        error:
          "Missing Rami Levy credentials. Required: authorization, ecomtoken, cookie, userId",
      };
    }

    return { credentials: ramiLevyCredentials, error: null };
  } else if (website === "shufersal") {
    const shufersalCredentials = {
      csrftoken: credentials.csrftoken,
      cookie: credentials.cookie,
    };

    // Check if all required credentials are present
    if (!shufersalCredentials.csrftoken || !shufersalCredentials.cookie) {
      return {
        credentials: null,
        error: "Missing Shufersal credentials. Required: csrftoken, cookie",
      };
    }

    return { credentials: shufersalCredentials, error: null };
  }

  return { credentials: null, error: `Unsupported website: ${website}` };
}

// Tool 1: Search Products
export const searchProducts = tool({
  description:
    "Search for products on supported shopping websites (Rami Levy, Shufersal). Returns product information including title, price, availability, and ratings. You must search in Hebrew for Israeli websites, example: milk -> חלב",
  inputSchema: z.object({
    website: z
      .enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal])
      .describe("Shopping website to search"),
    query: z
      .string()
      .min(1, "Search query cannot be empty")
      .describe("Product search query"),
    category: z.string().optional().describe("Product category filter"),
    priceRange: z
      .object({
        min: z.number().min(0).describe("Minimum price"),
        max: z.number().min(0).describe("Maximum price"),
      })
      .optional()
      .describe("Price range filter"),
    credentials: z
      .any()
      .optional()
      .describe("Authentication credentials for the website"),
  }),
  execute: async ({
    website,
    query,
    category,
    priceRange,
    credentials,
  }: SearchProductsParams) => {
    try {
      console.log(`[Shopping] Searching "${query}" on ${website}`);

      // Security validation
      const queryValidation = ShoppingSecurity.validateSearchQuery(query);
      if (!queryValidation.isValid) {
        return { error: queryValidation.error };
      }

      const categoryValidation = ShoppingSecurity.validateCategory(category);
      if (!categoryValidation.isValid) {
        return { error: categoryValidation.error };
      }

      const priceRangeValidation =
        ShoppingSecurity.validatePriceRange(priceRange);
      if (!priceRangeValidation.isValid) {
        return { error: priceRangeValidation.error };
      }

      // Get credentials for the website
      const credentialsResult = getCredentialsForWebsite(website, credentials);
      if (!credentialsResult.credentials) {
        return { error: credentialsResult.error };
      }

      // Get adapter for the website
      const adapter = ShoppingAdapterFactory.getAdapter(
        website,
        credentialsResult.credentials
      );

      // Execute search
      const result = await adapter.searchProducts(
        {
          query: queryValidation.sanitized,
          category: categoryValidation.sanitized,
          priceRange,
        },
        credentialsResult.credentials
      );

      if (!result.success) {
        return {
          error: `Search failed: ${ShoppingSecurity.formatSecureError(
            result.error || "Unknown error"
          )}`,
        };
      }

      const products = result.data?.products || [];
      const totalCount = result.data?.totalCount || 0;

      return {
        website: website.toUpperCase(),
        query: query,
        totalCount: totalCount,
        products: products.map((product, index) => ({
          rank: index + 1,
          id: product.id,
          title: product.title,
          price: `${product.currency} ${product.price}`,
          availability: product.availability ? "In Stock" : "Out of Stock",
          rating: product.rating
            ? `${product.rating}/5 (${product.reviewCount || 0} reviews)`
            : "No rating",
          category: product.category || "N/A",
          description:
            product.description.slice(0, 150) +
            (product.description.length > 150 ? "..." : ""),
        })),
      };
    } catch (error) {
      console.error("[Shopping] Search error:", error);
      return {
        error: `Failed to search products: ${ShoppingSecurity.formatSecureError(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
      };
    }
  },
});

// Tool 2: Add to Cart
export const addToCart = tool({
  description:
    "Add a product to the shopping cart on the specified website. Requires product ID from search results.",
  inputSchema: z.object({
    website: z
      .enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal])
      .describe("Shopping website"),
    productId: z
      .string()
      .min(1, "Product ID cannot be empty")
      .describe("Unique product identifier"),
    quantity: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(1)
      .describe("Quantity to add to cart"),
    variant: z
      .string()
      .optional()
      .describe("Product variant (size, color, etc.)"),
    credentials: z
      .any()
      .optional()
      .describe("Authentication credentials for the website"),
  }),
  execute: async ({
    website,
    productId,
    quantity,
    variant,
    credentials,
  }: AddToCartParams) => {
    try {
      console.log(
        `[Shopping] Adding to cart: ${productId} (${quantity}) on ${website}`
      );

      // Security validation
      const productIdValidation = ShoppingSecurity.validateProductId(
        productId,
        website
      );
      if (!productIdValidation.isValid) {
        return { error: productIdValidation.error };
      }

      const quantityValidation = ShoppingSecurity.validateQuantity(quantity);
      if (!quantityValidation.isValid) {
        return { error: quantityValidation.error };
      }

      const variantValidation = ShoppingSecurity.validateVariant(variant);
      if (!variantValidation.isValid) {
        return { error: variantValidation.error };
      }

      // Get credentials for the website
      const credentialsResult = getCredentialsForWebsite(website, credentials);
      if (!credentialsResult.credentials) {
        return { error: credentialsResult.error };
      }

      // Get adapter for the website
      const adapter = ShoppingAdapterFactory.getAdapter(
        website,
        credentialsResult.credentials
      );

      // Add to cart
      const result = await adapter.addToCart(
        productId,
        quantity,
        credentialsResult.credentials,
        variantValidation.sanitized
      );

      if (!result.success) {
        return {
          error: `Failed to add to cart: ${ShoppingSecurity.formatSecureError(
            result.error || "Unknown error"
          )}`,
        };
      }

      const cartResult = result.data!;

      // Handle both string and CartItem responses
      if (typeof cartResult === "string") {
        return {
          website: website.toUpperCase(),
          result: cartResult,
        };
      } else {
        // Handle CartItem response
        const cartItem = cartResult;
        return {
          website: website.toUpperCase(),
          product: cartItem.productTitle,
          quantity: cartItem.quantity,
          unitPrice:
            cartItem.unitPrice !== undefined
              ? cartItem.unitPrice.toFixed(2)
              : undefined,
          totalPrice:
            cartItem.totalPrice !== undefined
              ? cartItem.totalPrice.toFixed(2)
              : undefined,
          cartItemId: cartItem.id,
          variant: cartItem.variant || undefined,
        };
      }
    } catch (error) {
      console.error("[Shopping] Add to cart error:", error);
      return {
        error: `Failed to add to cart: ${ShoppingSecurity.formatSecureError(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
      };
    }
  },
});

// Tool 3: Remove from Cart
export const removeFromCart = tool({
  description:
    "Remove an item from the shopping cart. Requires cart item ID from previous cart operations.",
  inputSchema: z.object({
    website: z
      .enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal])
      .describe("Shopping website"),
    cartItemId: z
      .string()
      .min(1, "Cart item ID cannot be empty")
      .describe("Cart item identifier to remove"),
    credentials: z
      .any()
      .optional()
      .describe("Authentication credentials for the website"),
  }),
  execute: async ({
    website,
    cartItemId,
    credentials,
  }: RemoveFromCartParams) => {
    try {
      console.log(`[Shopping] Removing from cart: ${cartItemId} on ${website}`);

      // Security validation
      const cartItemValidation =
        ShoppingSecurity.validateCartItemId(cartItemId);
      if (!cartItemValidation.isValid) {
        return { error: cartItemValidation.error };
      }

      // Get credentials for the website
      const credentialsResult = getCredentialsForWebsite(website, credentials);
      if (!credentialsResult.credentials) {
        return { error: credentialsResult.error };
      }

      // Get adapter for the website
      const adapter = ShoppingAdapterFactory.getAdapter(
        website,
        credentialsResult.credentials
      );

      // Remove from cart
      const result = await adapter.removeFromCart(
        cartItemId,
        credentialsResult.credentials
      );

      if (!result.success) {
        return {
          error: `Failed to remove from cart: ${ShoppingSecurity.formatSecureError(
            result.error || "Unknown error"
          )}`,
        };
      }

      return {
        website: website.toUpperCase(),
        cartItem: cartItemId,
        status: "Successfully removed",
      };
    } catch (error) {
      console.error("[Shopping] Remove from cart error:", error);
      return {
        error: `Failed to remove from cart: ${ShoppingSecurity.formatSecureError(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
      };
    }
  },
});

// Tool 4: Update Cart Quantity
export const updateCartQuantity = tool({
  description:
    "Update the quantity of an item in the shopping cart. Set quantity to 0 to remove the item.",
  inputSchema: z.object({
    website: z
      .enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal])
      .describe("Shopping website"),
    cartItemId: z
      .string()
      .min(1, "Cart item ID cannot be empty")
      .describe("Cart item identifier to update"),
    quantity: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe("New quantity (0 to remove item)"),
    credentials: z
      .any()
      .optional()
      .describe("Authentication credentials for the website"),
  }),
  execute: async ({
    website,
    cartItemId,
    quantity,
    credentials,
  }: UpdateCartQuantityParams) => {
    try {
      console.log(
        `[Shopping] Updating cart quantity: ${cartItemId} to ${quantity} on ${website}`
      );

      // Security validation
      const cartItemValidation =
        ShoppingSecurity.validateCartItemId(cartItemId);
      if (!cartItemValidation.isValid) {
        return { error: cartItemValidation.error };
      }

      const quantityValidation = ShoppingSecurity.validateQuantity(quantity);
      if (!quantityValidation.isValid) {
        return { error: quantityValidation.error };
      }

      // Get credentials for the website
      const credentialsResult = getCredentialsForWebsite(website, credentials);
      if (!credentialsResult.credentials) {
        return { error: credentialsResult.error };
      }

      // Get adapter for the website
      const adapter = ShoppingAdapterFactory.getAdapter(
        website,
        credentialsResult.credentials
      );

      // Update quantity
      const result = await adapter.updateCartQuantity(
        cartItemId,
        quantity,
        credentialsResult.credentials
      );

      if (!result.success) {
        return {
          error: `Failed to update cart quantity: ${ShoppingSecurity.formatSecureError(
            result.error || "Unknown error"
          )}`,
        };
      }

      const cartItem = result.data!;

      return {
        website: website.toUpperCase(),
        product: cartItem.productTitle,
        newQuantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        newTotalPrice: cartItem.totalPrice,
      };
    } catch (error) {
      console.error("[Shopping] Update cart quantity error:", error);
      return {
        error: `Failed to update cart quantity: ${ShoppingSecurity.formatSecureError(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
      };
    }
  },
});

// Tool 5: Get Cart Contents
export const getCartContents = tool({
  description:
    "View the current contents of the shopping cart, including all items, quantities, and total price.",
  inputSchema: z.object({
    website: z
      .enum([SiteAdapterName.ramiLevy, SiteAdapterName.shufersal])
      .describe("Shopping website"),
    credentials: z
      .any()
      .optional()
      .describe("Authentication credentials for the website"),
  }),
  execute: async ({ website, credentials }: GetCartContentsParams) => {
    try {
      console.log(`[Shopping] Getting cart contents for ${website}`);

      // Get credentials for the website
      const credentialsResult = getCredentialsForWebsite(website, credentials);
      if (!credentialsResult.credentials) {
        return { error: credentialsResult.error };
      }

      // Get adapter for the website
      const adapter = ShoppingAdapterFactory.getAdapter(
        website,
        credentialsResult.credentials
      );

      // Get cart contents
      const result = await adapter.getCartContents(
        credentialsResult.credentials
      );

      if (!result.success) {
        return {
          error: `Failed to get cart contents: ${ShoppingSecurity.formatSecureError(
            result.error || "Unknown error"
          )}`,
        };
      }

      const cart = result.data!;

      if (cart.items.length === 0) {
        return {
          website: website.toUpperCase(),
          status: "Empty",
          totalItems: 0,
          totalPrice:
            cart.totalPrice !== undefined
              ? `${cart.currency} ${cart.totalPrice.toFixed(2)}`
              : undefined,
        };
      }

      return {
        website: website.toUpperCase(),
        totalItems: cart.totalItems,
        totalPrice:
          cart.totalPrice !== undefined
            ? `${cart.currency} ${cart.totalPrice.toFixed(2)}`
            : undefined,
        items: cart.items.map((item, index) => ({
          rank: index + 1,
          product: item.productTitle,
          quantity: item.quantity,
          unitPrice:
            item.unitPrice !== undefined
              ? `${cart.currency} ${item.unitPrice.toFixed(2)}`
              : undefined,
          totalPrice:
            item.totalPrice !== undefined
              ? `${cart.currency} ${item.totalPrice.toFixed(2)}`
              : undefined,
          cartItemId: item.id,
          variant: item.variant || undefined,
        })),
      };
    } catch (error) {
      console.error("[Shopping] Get cart contents error:", error);
      return {
        error: `Failed to get cart contents: ${ShoppingSecurity.formatSecureError(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
      };
    }
  },
});

// Export all tools as an object for easier consumption
export const shoppingTools = {
  searchProducts,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartContents,
};
