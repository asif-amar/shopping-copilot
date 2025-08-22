import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  SITE_CREDENTIAL_HEADERS,
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

// Default user ID for development/testing
const DEFAULT_USER_ID = 1;

// Convert adapter name and credentials to MCP headers
export function createMCPHeaders(
  adapterName?: string,
  credentials?: any
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  // Add site name header if provided
  if (adapterName) {
    headers[SITE_CREDENTIAL_HEADERS.SITE_NAME] = adapterName;
  }

  // Add credentials based on adapter type
  if (credentials && adapterName) {
    if (adapterName === SiteAdapterName.ramiLevy) {
      if (credentials.authorization)
        headers[SITE_CREDENTIAL_HEADERS.RAMI_LEVY_AUTHORIZATION] =
          credentials.authorization;
      if (credentials.ecomtoken)
        headers[SITE_CREDENTIAL_HEADERS.RAMI_LEVY_ECOM_TOKEN] =
          credentials.ecomtoken;
      if (credentials.cookie)
        headers[SITE_CREDENTIAL_HEADERS.RAMI_LEVY_COOKIE] = credentials.cookie;
      if (credentials.userId)
        headers[SITE_CREDENTIAL_HEADERS.RAMI_LEVY_USER_ID] = credentials.userId;
    } else if (adapterName === SiteAdapterName.shufersal) {
      if (credentials.csrftoken)
        headers[SITE_CREDENTIAL_HEADERS.SHUFERSAL_CSRF_TOKEN] =
          credentials.csrftoken;
      if (credentials.cookie)
        headers[SITE_CREDENTIAL_HEADERS.SHUFERSAL_COOKIE] = credentials.cookie;
    }
  }

  return headers;
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

// Setup MCP client with common configuration
export async function setupMCPClient(
  adapterName?: string,
  credentials?: any
): Promise<{ mcpClient: any; tools: any }> {
  const mcpHeaders = createMCPHeaders(adapterName, credentials);
  const mcpServerUrl = process.env.MCP_SERVER_URL;

  if (!mcpServerUrl) {
    throw new Error("MCP URL is not defined");
  }

  logger.info(`Creating MCP client at ${mcpServerUrl}`);
  logger.info(
    `Forwarding adapter: ${adapterName || "none"} with ${
      Object.keys(mcpHeaders).length
    } headers`
  );

  const httpTransport = new StreamableHTTPClientTransport(
    new URL(mcpServerUrl),
    {
      requestInit: {
        headers: mcpHeaders,
      },
    }
  );

  const mcpClient = await experimental_createMCPClient({
    transport: httpTransport,
  });

  logger.info("MCP client created successfully");

  const tools = await mcpClient.tools();

  logger.info(
    `Tools retrieved from MCP client (${
      tools ? Object.keys(tools).length : 0
    } tools)`
  );

  return { mcpClient, tools };
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
