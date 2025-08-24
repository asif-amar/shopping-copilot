import { Router } from "express";
import { generateText, stepCountIs, streamText } from "ai";
import { validateStreamRequest } from "../middleware/validation";
import { StreamRequest } from "../types";
import logger from "../utils/logger";
import {
  ensureUserAndConversation,
  storeUserMessage,
  getConversationHistory,
  setupMCPClient,
  setupGoogleAI,
  storeAssistantMessage,
} from "../utils/chat-helpers";
import { AGENT_PROMPT } from "../utils/llm-prompts";

const router = Router();

router.post(
  "/stream",
  validateStreamRequest,
  async (req, res): Promise<any> => {
    try {
      const {
        messages,
        temperature = 0.7,
        adapterName,
        credentials,
        user_id,
        conversation_id,
      }: StreamRequest = req.body;

      logger.info(
        `Stream endpoint called: /stream (${messages.length} messages)`
      );

      // Initialize user and conversation
      const { conversation } = await ensureUserAndConversation(
        user_id,
        conversation_id
      );

      // Store user message to database
      await storeUserMessage(messages, conversation.id);

      // Load conversation history
      const conversationHistory = await getConversationHistory(conversation.id);

      // Setup Google AI and MCP client
      const google = setupGoogleAI();
      const { tools, mcpClient } = await setupMCPClient(
        adapterName,
        credentials
      );

      const result = streamText({
        model: google("gemini-2.0-flash-exp"),
        tools,
        stopWhen: stepCountIs(5),
        messages: conversationHistory,
        temperature,
        system: AGENT_PROMPT,
        onFinish: async () => {
          await mcpClient.close();
        },
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
  // TODO: check about MCPClient .close()
  try {
    // const {id: user_id} = req.user;

    const {
      messages,
      temperature = 0.7,
      adapterName,
      credentials,
      user_id, // TODO: change to proper Auth later, add req.user in middleware
      conversation_id,
    }: StreamRequest = req.body;

    logger.info(
      `Complete endpoint called: /complete (${messages.length} messages)`
    );
    console.log("adapterName", adapterName);
    console.log(credentials);

    // Initialize user and conversation
    const { conversation } = await ensureUserAndConversation(
      user_id,
      conversation_id
    );

    // Store user message to database
    await storeUserMessage(messages, conversation.id);

    // Load conversation history
    const conversationHistory = await getConversationHistory(conversation.id);

    // Setup Google AI and MCP client
    const google = setupGoogleAI();
    const { tools } = await setupMCPClient(adapterName, credentials);

    const result = await generateText({
      model: google("gemini-2.0-flash-exp"),
      tools,
      messages: conversationHistory,
      stopWhen: stepCountIs(5),
      temperature,
      system: AGENT_PROMPT,
    });

    const fullText = result.text;
    logger.info(`Text generation completed (${fullText.length} characters)`);

    // Store assistant response to database
    const assistantMessageDB = await storeAssistantMessage(
      fullText,
      conversation.id
    );
    logger.info(`Stored assistant message to database`);

    res.json({
      message: {
        id: assistantMessageDB?.id || Date.now(),
        role: "assistant",
        content: fullText,
        model: "gemini-2.0-flash-exp",
        temperature,
        created_at: assistantMessageDB?.created_at || new Date(),
      },
    });
  } catch (error) {
    logger.error(
      `Completion error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({
      error: "Failed to generate response",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
