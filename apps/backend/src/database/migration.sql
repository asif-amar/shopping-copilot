-- Migration script to update database schema
-- Run this script to update existing database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rename tables
ALTER TABLE IF EXISTS chat_sessions RENAME TO conversations;
ALTER TABLE IF EXISTS chat_messages RENAME TO messages;

-- Update users table (remove session_id, add email/name)
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS session_id;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update conversations table
ALTER TABLE IF EXISTS conversations DROP COLUMN IF EXISTS session_id;
-- Note: Converting existing SERIAL id to UUID requires data migration
-- For new installations, conversations.id will be UUID
-- For existing data, you may need to:
-- 1. Create new UUID column
-- 2. Generate UUIDs for existing records
-- 3. Update foreign key references
-- 4. Drop old column and rename new one

-- Rename columns in messages table
ALTER TABLE IF EXISTS messages RENAME COLUMN chat_session_id TO conversation_id;

-- Remove unnecessary columns from messages table
ALTER TABLE IF EXISTS messages DROP COLUMN IF EXISTS temperature;
ALTER TABLE IF EXISTS messages DROP COLUMN IF EXISTS model;

-- Update indexes
DROP INDEX IF EXISTS idx_users_session_id;
DROP INDEX IF EXISTS idx_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_chat_sessions_session_id;
DROP INDEX IF EXISTS idx_chat_messages_session_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Update triggers
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON conversations;

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();