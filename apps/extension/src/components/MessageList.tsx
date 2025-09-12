import React, { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Auto-scroll for new messages or when messages are updated (including streaming)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: messages.length === 0 && !isLoading ? "0" : "1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent:
          messages.length === 0 && !isLoading ? "center" : "flex-start",
        alignItems: messages.length === 0 && !isLoading ? "center" : "stretch",
        minHeight: 0, // Allow flex shrinking
        maxHeight: "100%", // Prevent overflow
      }}
    >
      <AnimatePresence>
        {messages.length === 0 && !isLoading ? (
          <EmptyState onQuickAction={onSendMessage} />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} onSendMessage={onSendMessage} />
          ))
        )}

        {isLoading && <TypingIndicator />}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
