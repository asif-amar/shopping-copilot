require("dotenv").config();

import { neon } from "@neondatabase/serverless";
import logger from "../utils/logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(process.env.DATABASE_URL);

export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    const { version } = result[0];
    logger.info(`Database connected successfully: ${version}`);
    return true;
  } catch (error) {
    logger.error(
      `Database connection failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    logger.info("Initializing database schema...");

    // Enable UUID extension
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
    `;

    logger.info("Database schema initialized successfully");
  } catch (error) {
    logger.error(
      `Database initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
