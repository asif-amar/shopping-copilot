import { sql } from './connection';
import { 
  User, 
  Conversation, 
  MessageDB, 
  CreateUserRequest, 
  CreateConversationRequest, 
  CreateMessageRequest 
} from '../types';
import logger from '../utils/logger';

// User operations
export async function createUser(data: CreateUserRequest): Promise<User> {
  try {
    const result = await sql`
      INSERT INTO users (email, name)
      VALUES (${data.email || null}, ${data.name || null})
      RETURNING *
    `;
    logger.info(`User created: ${result[0].id}`);
    return result[0] as User;
  } catch (error) {
    logger.error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;
    return result[0] as User || null;
  } catch (error) {
    logger.error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] as User || null;
  } catch (error) {
    logger.error(`Failed to get user by email: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Conversation operations
export async function createConversation(data: CreateConversationRequest): Promise<Conversation> {
  try {
    const result = await sql`
      INSERT INTO conversations (user_id, title)
      VALUES (${data.user_id}, ${data.title || null})
      RETURNING *
    `;
    logger.info(`Conversation created: ${result[0].id}`);
    return result[0] as Conversation;
  } catch (error) {
    logger.error(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getConversationsByUserId(userId: number): Promise<Conversation[]> {
  try {
    const result = await sql`
      SELECT * FROM conversations 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
    return result as Conversation[];
  } catch (error) {
    logger.error(`Failed to get conversations: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const result = await sql`
      SELECT * FROM conversations WHERE id = ${conversationId}
    `;
    return result[0] as Conversation || null;
  } catch (error) {
    logger.error(`Failed to get conversation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Message operations
export async function createMessage(data: CreateMessageRequest): Promise<MessageDB> {
  try {
    const result = await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${data.conversation_id}, ${data.role}, ${data.content})
      RETURNING *
    `;
    logger.info(`Message created for conversation ${data.conversation_id}: ${data.role}`);
    return result[0] as MessageDB;
  } catch (error) {
    logger.error(`Failed to create message: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getMessagesByConversationId(conversationId: string): Promise<MessageDB[]> {
  try {
    const result = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `;
    return result as MessageDB[];
  } catch (error) {
    logger.error(`Failed to get messages: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function deleteMessage(messageId: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM messages WHERE id = ${messageId}
    `;
    logger.info(`Message deleted: ${messageId}`);
    return (result as any).count > 0;
  } catch (error) {
    logger.error(`Failed to delete message: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<Conversation | null> {
  try {
    const result = await sql`
      UPDATE conversations 
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING *
    `;
    logger.info(`Conversation title updated: ${conversationId}`);
    return result[0] as Conversation || null;
  } catch (error) {
    logger.error(`Failed to update conversation title: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Analytics/reporting functions
export async function getConversationStats(userId?: number) {
  try {
    const baseQuery = userId 
      ? sql`
          SELECT 
            COUNT(DISTINCT c.id) as total_conversations,
            COUNT(m.id) as total_messages,
            COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages
          FROM conversations c
          LEFT JOIN messages m ON c.id = m.conversation_id
          WHERE c.user_id = ${userId}
        `
      : sql`
          SELECT 
            COUNT(DISTINCT c.id) as total_conversations,
            COUNT(m.id) as total_messages,
            COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages
          FROM conversations c
          LEFT JOIN messages m ON c.id = m.conversation_id
        `;

    const result = await baseQuery;
    return result[0];
  } catch (error) {
    logger.error(`Failed to get conversation stats: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}