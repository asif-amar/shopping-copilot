import React, { useState, useEffect } from "react";
import "@/styles/global.css";
import { useChat } from "@/hooks/useChat";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Header, MessageList, ChatInput, OnboardingModal } from "@/components";
import { AuthModal } from "@/components/AuthModal";
import { ConversationsDrawer } from "@/components/ConversationsDrawer";
import { ApiService } from "@/services/api";
import { UserPreferences } from "@/types/preferences";
import { ThemeProvider } from "@/components/theme-provider";

const SidePanelContent: React.FC = () => {
  const {
    messages,
    isLoading,
    currentHostname,
    sendMessage,
    startNewConversation,
    loadConversation,
  } = useChat();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConversationsDrawerOpen, setIsConversationsDrawerOpen] = useState(false);
  const [refreshConversations, setRefreshConversations] = useState<(() => Promise<void>) | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await ApiService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    // Check onboarding status if authenticated
    if (authenticated) {
      await checkOnboardingStatus();
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const status = await ApiService.getOnboardingStatus();
      
      // Show onboarding modal if not completed
      if (!status.onboarding_completed) {
        setIsOnboardingModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  const handleSendMessage = async (message: string, preferences?: UserPreferences) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    await sendMessage(message, preferences);
  };

  const handleAuthSuccess = async () => {
    await checkAuthStatus();
  };

  const handleOnboardingComplete = async () => {
    // Refresh onboarding status after completion
    await checkOnboardingStatus();
    setIsOnboardingModalOpen(false);
  };

  const handleNewConversation = async () => {
    await startNewConversation();
    // Refresh conversations list when starting a new conversation
    if (refreshConversations) {
      await refreshConversations();
    }
  };

  const handleSignOut = async () => {
    await startNewConversation();
    // Refresh conversations list after sign out
    if (refreshConversations) {
      await refreshConversations();
    }
  };

  return (
    <div
      className="h-screen flex flex-col bg-background"
    >
      <Header
        currentHostname={currentHostname}
        onNewConversation={handleNewConversation}
        onOpenConversations={() => setIsConversationsDrawerOpen(true)}
        onSignOut={handleSignOut}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} currentHostname={currentHostname} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConversationsDrawer
        isOpen={isConversationsDrawerOpen}
        onClose={() => setIsConversationsDrawerOpen(false)}
        onLoadConversation={loadConversation}
        preloadConversations={isAuthenticated}
        onRefreshConversations={setRefreshConversations}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export const SidePanel: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vibe-shopping-theme">
      <LanguageProvider>
        <SidePanelContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};
