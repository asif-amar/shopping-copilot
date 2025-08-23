import { Router, Request, Response } from "express";
import { stepCountIs, streamText, generateObject } from "ai";
import { validateStreamRequest } from "../middleware/validation";
import { StreamRequest } from "../types";
import { SiteAdapterNameValues, SiteAdapterNameList } from "@shopping-copilot/shared";
import logger from "../utils/logger";
import { z } from "zod";
import { ShoppingService } from "../services/shopping-service";
import {
  ensureUserAndConversation,
  storeUserMessage,
  getConversationHistory,
  setupGoogleAI,
  storeAssistantMessage,
} from "../utils/chat-helpers";
import { google } from "@ai-sdk/google";
import { AGENT_PROMPT, SHOPPING_ACTION_PROMPT } from "../utils/llm-prompts";

const router = Router();

// Helper to extract headers as string record
function extractHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers[key] = value;
    }
  }
  return headers;
}

// Shopping action schema that the LLM will choose from
const ShoppingActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("searchProducts"),
    website: z.enum(SiteAdapterNameList),
    query: z.string().min(1),
    category: z.string().optional(),
    priceRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }).optional(),
  }),
  z.object({
    action: z.literal("addToCart"),
    website: z.enum(SiteAdapterNameList),
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(100),
    variant: z.string().optional(),
  }),
  z.object({
    action: z.literal("removeFromCart"),
    website: z.enum(SiteAdapterNameList),
    cartItemId: z.string().min(1),
  }),
  z.object({
    action: z.literal("updateCartQuantity"),
    website: z.enum(SiteAdapterNameList),
    cartItemId: z.string().min(1),
    quantity: z.number().int().min(0).max(100),
  }),
  z.object({
    action: z.literal("getCartContents"),
    website: z.enum(SiteAdapterNameList),
  }),
  z.object({
    action: z.literal("chat"),
    message: z.string(),
  }),
]);

// Function to detect if message requires shopping action and execute it
async function handleShoppingAction(message: string, headers: Record<string, string>) {
  try {
    const google = setupGoogleAI();
    
    const { object: actionResult } = await generateObject({
      model: google("gemini-1.5-flash"),
      prompt: `${SHOPPING_ACTION_PROMPT}

User message: "${message}"`,
      schema: ShoppingActionSchema as any,
    });

    if (actionResult.action === "chat") {
      return null; // Not a shopping action, proceed with normal chat
    }

    // Execute shopping action
    const headerCredentials = ShoppingService.extractCredentials(headers);
    let result;
    let actionDescription;

    switch (actionResult.action) {
      case "searchProducts":
        if (!actionResult.website || !actionResult.query) {
          throw new Error("Missing required fields for searchProducts");
        }
        result = await ShoppingService.searchProducts(
          actionResult.website as SiteAdapterNameValues,
          actionResult.query,
          actionResult.category,
          actionResult.priceRange,
          headerCredentials
        );
        actionDescription = `Searched for "${actionResult.query}" on ${actionResult.website}`;
        break;

      case "addToCart":
        if (!actionResult.website || !actionResult.productId || !actionResult.quantity) {
          throw new Error("Missing required fields for addToCart");
        }
        result = await ShoppingService.addToCart(
          actionResult.website as SiteAdapterNameValues,
          actionResult.productId,
          actionResult.quantity,
          actionResult.variant,
          headerCredentials
        );
        actionDescription = `Added product ${actionResult.productId} to cart on ${actionResult.website}`;
        break;

      case "removeFromCart":
        if (!actionResult.website || !actionResult.cartItemId) {
          throw new Error("Missing required fields for removeFromCart");
        }
        result = await ShoppingService.removeFromCart(
          actionResult.website as SiteAdapterNameValues,
          actionResult.cartItemId,
          headerCredentials
        );
        actionDescription = `Removed item ${actionResult.cartItemId} from cart on ${actionResult.website}`;
        break;

      case "updateCartQuantity":
        if (!actionResult.website || !actionResult.cartItemId || actionResult.quantity === undefined) {
          throw new Error("Missing required fields for updateCartQuantity");
        }
        result = await ShoppingService.updateCartQuantity(
          actionResult.website as SiteAdapterNameValues,
          actionResult.cartItemId,
          actionResult.quantity,
          headerCredentials
        );
        actionDescription = `Updated cart item ${actionResult.cartItemId} quantity to ${actionResult.quantity}`;
        break;

      case "getCartContents":
        if (!actionResult.website) {
          throw new Error("Missing required fields for getCartContents");
        }
        result = await ShoppingService.getCartContents(
          actionResult.website as SiteAdapterNameValues,
          headerCredentials
        );
        actionDescription = `Retrieved cart contents from ${actionResult.website}`;
        break;

      default:
        return null;
    }

    return {
      action: actionResult.action,
      actionDescription,
      website: actionResult.website.toUpperCase(),
      result,
      llmAction: actionResult
    };

  } catch (error) {
    logger.error(`[Shopping Action] Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

router.post(
  "/stream",
  validateStreamRequest,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const {
        messages,
        temperature = 0.7,
      }: StreamRequest = req.body;

      // Extract credentials from headers instead of body
      const requestHeaders = extractHeaders(req);

      logger.info(
        `Stream endpoint called: /stream (${messages.length} messages)`
      );

      const lastMessage = messages[messages.length - 1];
      
      // Check if this is a shopping request
      const shoppingResult = await handleShoppingAction(lastMessage.content, requestHeaders);
      
      if (shoppingResult) {
        // This is a shopping request - return the result directly
        logger.info(`Shopping action executed: ${shoppingResult.actionDescription}`);
        
        const response = {
          id: `msg-${Date.now()}`,
          role: "assistant" as const,
          content: JSON.stringify(shoppingResult, null, 2),
          parts: [{ type: "text", text: JSON.stringify(shoppingResult, null, 2) }]
        };

        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // This is a regular chat request - proceed with normal streaming
      // Initialize user and conversation
      const { conversation } = await ensureUserAndConversation();

      // Store user message to database
      await storeUserMessage(messages, conversation.id);

      // Load conversation history
      const conversationHistory = await getConversationHistory(conversation.id);

      // Setup Google AI without shopping tools (use regular chat)
      const google = setupGoogleAI();

      const result = streamText({
        model: google("gemini-2.0-flash-exp"),
        stopWhen: stepCountIs(5),
        messages: conversationHistory,
        temperature,
        system: AGENT_PROMPT,
      });

      logger.info(
        `Starting streaming response with gemini-2.0-flash-exp (temp: ${temperature})`
      );

      return result.toUIMessageStreamResponse({
        originalMessages: conversationHistory.map((msg) => ({
          id: `msg-${Date.now()}-${Math.random()}`,
          role: msg.role,
          content: msg.content,
          parts: [{ type: "text", text: msg.content }],
        })),
        onFinish: async ({ messages: finalMessages }) => {
          try {
            const assistantMessage = finalMessages[finalMessages.length - 1];
            if (assistantMessage && assistantMessage.role === "assistant") {
              const content =
                assistantMessage.parts
                  ?.map((part) => (part.type === "text" ? part.text : ""))
                  .join("") || "";

              await storeAssistantMessage(content, conversation.id);
              logger.info(`Stored assistant message to database`);
            }
          } catch (dbError) {
            logger.error(
              `Failed to store assistant message: ${
                dbError instanceof Error ? dbError.message : String(dbError)
              }`
            );
          }
        },
      });
    } catch (error) {
      logger.error(
        `Streaming error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to stream response",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }
);

router.post("/complete", validateStreamRequest, async (req, res) => {
  try {
    const { messages }: StreamRequest = req.body;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || typeof lastMessage.content !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    logger.info(`[Chat Complete] Request received: ${lastMessage.content.slice(0, 100)}...`);

    // Extract credentials from headers
    const headers = extractHeaders(req);
    const headerCredentials = ShoppingService.extractCredentials(headers);

    // Set Google API key from environment 
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
    
    // Use LLM to determine the shopping action
    const { object: shoppingAction } = await generateObject({
      model: google("gemini-1.5-flash"),
      prompt: `${SHOPPING_ACTION_PROMPT}

User message: "${lastMessage.content}"

Additional notes for this endpoint:
- If user wants to add something to cart but doesn't provide a product ID, you must SEARCH first, not addToCart
- Only use addToCart when you have a specific numeric product ID (like "12345")
- Quantity should be reasonable (1-10 for most products)

CRITICAL: If user says "add [product name] to cart" without a product ID, choose searchProducts action to find the product first!`,
      schema: ShoppingActionSchema as any
    });

    logger.info(`[Chat Complete] LLM chose action: ${shoppingAction.action}`);
    console.log('[DEBUG] Full LLM decision:', JSON.stringify(shoppingAction, null, 2));

    // Execute the determined action (EXACT same as working shopping route)
    let result;
    let actionDescription;

    switch (shoppingAction.action) {
      case "searchProducts":
        const searchResult = await ShoppingService.searchProducts(
          shoppingAction.website,
          shoppingAction.query,
          shoppingAction.category,
          shoppingAction.priceRange,
          headerCredentials
        );

        // Check if this was actually an "add to cart" intent by looking at the original message
        const isAddToCartIntent = /add.*to.*cart|הוסף.*לעגלה|הוסף.*עגלה/i.test(lastMessage.content);
        
        if (isAddToCartIntent && searchResult?.products && searchResult.products.length > 0) {
          // User wants to add to cart - automatically add the first search result
          const firstProduct = searchResult.products[0];
          const addResult = await ShoppingService.addToCart(
            shoppingAction.website,
            firstProduct.id,
            1, // default quantity
            undefined, // no variant
            headerCredentials
          );
          
          result = {
            searchResults: searchResult,
            addToCartResult: addResult,
            productAdded: firstProduct
          };
          actionDescription = `Found "${shoppingAction.query}" and added ${firstProduct.title} to cart on ${shoppingAction.website}`;
        } else {
          // Regular search
          result = searchResult;
          actionDescription = `Searched for "${shoppingAction.query}" on ${shoppingAction.website}`;
        }
        break;

      case "addToCart":
        result = await ShoppingService.addToCart(
          shoppingAction.website,
          shoppingAction.productId,
          shoppingAction.quantity,
          shoppingAction.variant,
          headerCredentials
        );
        actionDescription = `Added product ${shoppingAction.productId} (qty: ${shoppingAction.quantity}) to cart on ${shoppingAction.website}`;
        break;

      case "removeFromCart":
        result = await ShoppingService.removeFromCart(
          shoppingAction.website,
          shoppingAction.cartItemId,
          headerCredentials
        );
        actionDescription = `Removed item ${shoppingAction.cartItemId} from cart on ${shoppingAction.website}`;
        break;

      case "updateCartQuantity":
        result = await ShoppingService.updateCartQuantity(
          shoppingAction.website,
          shoppingAction.cartItemId,
          shoppingAction.quantity,
          headerCredentials
        );
        actionDescription = `Updated cart item ${shoppingAction.cartItemId} quantity to ${shoppingAction.quantity} on ${shoppingAction.website}`;
        break;

      case "getCartContents":
        result = await ShoppingService.getCartContents(
          shoppingAction.website,
          headerCredentials
        );
        actionDescription = `Retrieved cart contents from ${shoppingAction.website}`;
        break;

      case "chat":
        // Handle regular chat - return a simple chat response
        return res.json({
          success: true,
          action: "chat",
          actionDescription: "Regular conversation",
          message: "I'm here to help with shopping on Rami Levy and Shufersal. You can ask me to search for products, add items to cart, or manage your shopping cart!",
        });

      default:
        return res.status(400).json({
          success: false,
          error: "Unknown shopping action",
        });
    }

    logger.info(`[Chat Complete] Action completed successfully: ${actionDescription}`);

    // Return structured response (EXACT same as working shopping route)
    return res.json({
      success: true,
      action: shoppingAction.action,
      actionDescription,
      website: shoppingAction.website.toUpperCase(),
      data: result,
      llmAction: shoppingAction,
    });

  } catch (error) {
    logger.error(`[Chat Complete] Error: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
