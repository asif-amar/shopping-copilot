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
    // Only scroll down if the last message is from the user or the assistant is done responding.
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && (lastMessage.isUser || lastMessage.isComplete)) {
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
      }}
    >
      <AnimatePresence>
        {messages.length === 0 && !isLoading ? (
          <EmptyState onQuickAction={onSendMessage} />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && <TypingIndicator />}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
