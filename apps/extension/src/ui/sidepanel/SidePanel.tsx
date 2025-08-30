import React from "react";
import "@/styles/global.css";
import { useChat } from "@/hooks/useChat";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Header, MessageList, ChatInput } from "@/components";

const SidePanelContent: React.FC = () => {
  const {
    messages,
    isLoading,
    currentHostname,
    sendMessage,
    startNewConversation,
  } = useChat();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Header
        currentHostname={currentHostname}
        onNewConversation={startNewConversation}
      />

      <MessageList messages={messages} isLoading={isLoading} onSendMessage={sendMessage} />

      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export const SidePanel: React.FC = () => {
  return (
    <LanguageProvider>
      <SidePanelContent />
    </LanguageProvider>
  );
};
