import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  getUserById,
  createConversation,
  getConversationsByUserId,
  getConversationById,
  createMessage,
  getMessagesByConversationId,
  deleteMessage,
  updateConversationTitle,
  getConversationStats,
} from "../database/queries";
import logger from "../utils/logger";

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

const createConversationSchema = z.object({
  user_id: z.number().int().positive(),
  title: z.string().optional(),
});

const createMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

// User endpoints
router.post("/users", async (req, res): Promise<any> => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request data", details: error.errors });
    }
    logger.error(
      `Failed to create user: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/users/:userId", async (req, res): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error(
      `Failed to get user: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Conversation endpoints
router.post("/conversations", async (req, res): Promise<any> => {
  try {
    const data = createConversationSchema.parse(req.body);
    const conversation = await createConversation(data);
    res.status(201).json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request data", details: error.errors });
    }
    logger.error(
      `Failed to create conversation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/user/:userId", async (req, res): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const conversations = await getConversationsByUserId(userId);
    res.json(conversations);
  } catch (error) {
    logger.error(
      `Failed to get conversations: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

router.get("/conversations/:conversationId", async (req, res): Promise<any> => {
  try {
    const { conversationId } = req.params;

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    logger.error(
      `Failed to get conversation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.put(
  "/conversations/:conversationId/title",
  async (req, res): Promise<any> => {
    try {
      const { conversationId } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== "string") {
        return res
          .status(400)
          .json({ error: "Title is required and must be a string" });
      }

      const conversation = await updateConversationTitle(conversationId, title);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      logger.error(
        `Failed to update conversation title: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({ error: "Failed to update conversation title" });
    }
  }
);

// Message endpoints
router.post("/messages", async (req, res): Promise<any> => {
  try {
    const data = createMessageSchema.parse(req.body);
    const message = await createMessage(data);
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request data", details: error.errors });
    }
    logger.error(
      `Failed to create message: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to create message" });
  }
});

router.get("/messages/conversation/:conversationId", async (req, res): Promise<any> => {
  try {
    const { conversationId } = req.params;

    const messages = await getMessagesByConversationId(conversationId);
    res.json(messages);
  } catch (error) {
    logger.error(
      `Failed to get messages: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.delete("/messages/:messageId", async (req, res): Promise<any> => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const deleted = await deleteMessage(messageId);
    if (!deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(204).send();
  } catch (error) {
    logger.error(
      `Failed to delete message: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Stats endpoint
router.get("/stats/:userId?", async (req, res): Promise<any> => {
  try {
    const userId = req.params.userId ? parseInt(req.params.userId) : undefined;

    if (req.params.userId && isNaN(userId!)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const stats = await getConversationStats(userId);
    res.json(stats);
  } catch (error) {
    logger.error(
      `Failed to get stats: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
