import React, { useState, useEffect } from "react";
import "@/styles/global.css";
import { useChat } from "@/hooks/useChat";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Header, MessageList, ChatInput } from "@/components";
import { AuthModal } from "@/components/AuthModal";
import { ApiService } from "@/services/api";

const SidePanelContent: React.FC = () => {
  const {
    messages,
    isLoading,
    currentHostname,
    sendMessage,
    startNewConversation,
  } = useChat();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await ApiService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleSendMessage = async (message: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    await sendMessage(message);
  };

  const handleAuthSuccess = async () => {
    await checkAuthStatus();
  };

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

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
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
