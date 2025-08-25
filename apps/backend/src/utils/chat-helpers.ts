import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  RAMI_LEVY_CREDENTIALS,
  SHUFERSAL_CREDENTIALS,
  SiteAdapterName,
} from "@shopping-copilot/shared";
import {
  createUser,
  getUserById,
  createConversation,
  getConversationById,
  createMessage,
  getMessagesByConversationId,
} from "../database/queries";
import logger from "./logger";
import { ChatMessage } from "../types";
import { shoppingTools } from "../tools/shopping-tools";

// Default user ID for development/testing
const DEFAULT_USER_ID = 1;

// Helper function to prepare credentials for shopping tools
function prepareCredentialsForTools(
  adapterName?: string,
  credentials?: any
): any {
  if (!credentials || !adapterName) {
    return null;
  }

  // Convert credentials from the format used in the request to the format expected by tools
  if (adapterName === SiteAdapterName.ramiLevy) {
    return {
      authorization: credentials[RAMI_LEVY_CREDENTIALS.AUTHORIZATION],
      ecomtoken: credentials[RAMI_LEVY_CREDENTIALS.ECOM_TOKEN],
      cookie: credentials[RAMI_LEVY_CREDENTIALS.COOKIE],
      userId: credentials[RAMI_LEVY_CREDENTIALS.USER_ID],
    };
  } else if (adapterName === SiteAdapterName.shufersal) {
    return {
      csrftoken: credentials[SHUFERSAL_CREDENTIALS.CSRF_TOKEN],
      cookie: credentials[SHUFERSAL_CREDENTIALS.COOKIE],
    };
  }

  return null;
}

// Convert database messages to chat message format
export function convertDBMessagesToChat(dbMessages: any[]): ChatMessage[] {
  return dbMessages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));
}

// Initialize user and conversation
export async function ensureUserAndConversation(
  userId?: number,
  conversationId?: string
) {
  try {
    // TODO: Change to proper Auth later
    let user;
    if (userId) {
      user = await getUserById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
    } else {
      // For demo/development - use default user or create one
      user = await getUserById(DEFAULT_USER_ID);
      if (!user) {
        user = await createUser({ name: "Demo User" });
        logger.info(`Created demo user: ${user.id}`);
      }
    }

    let conversation;
    if (conversationId) {
      conversation = await getConversationById(conversationId);
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
    } else {
      // Create a new conversation for this session
      conversation = await createConversation({
        user_id: user.id,
        title: "New Conversation",
      });
      logger.info(`Created new conversation: ${conversation.id}`);
    }

    return { user, conversation };
  } catch (error) {
    logger.error(
      `Failed to initialize user/session: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

// Store user message to database
export async function storeUserMessage(
  messages: ChatMessage[],
  conversationId: string
) {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user") {
    await createMessage({
      conversation_id: conversationId,
      role: lastMessage.role,
      content: lastMessage.content,
    });
    logger.info(`Stored user message to database`);
  }
}

// Load conversation history from database
export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  const dbMessages = await getMessagesByConversationId(conversationId);
  const conversationHistory = convertDBMessagesToChat(dbMessages);
  logger.info(
    `Loaded ${conversationHistory.length} messages from database for context`
  );
  return conversationHistory;
}

// Setup shopping tools with credentials
export function setupShoppingTools(
  adapterName?: string,
  credentials?: any
): any {
  logger.info(`Setting up shopping tools for: ${adapterName || "none"}`);

  const preparedCredentials = prepareCredentialsForTools(
    adapterName,
    credentials
  );

  logger.info(
    `Credentials prepared: ${
      preparedCredentials ? "✅" : "❌"
    } for adapter: ${adapterName}`
  );

  console.log(preparedCredentials);

  // Create tools with bound credentials using spread operator to include credentials in all calls
  const tools = Object.fromEntries(
    Object.entries(shoppingTools).map(([toolName, tool]) => [
      toolName,
      {
        ...tool,
        execute: async (params: any) => {
          return (tool as any).execute({
            ...params,
            credentials: preparedCredentials,
          });
        },
      },
    ])
  );

  logger.info(
    `Shopping tools setup completed (${Object.keys(tools).length} tools)`
  );

  return tools;
}

// Setup Google AI model
export function setupGoogleAI() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// Store assistant message to database
export async function storeAssistantMessage(
  content: string,
  conversationId: string
) {
  return await createMessage({
    conversation_id: conversationId,
    role: "assistant",
    content,
  });
}
