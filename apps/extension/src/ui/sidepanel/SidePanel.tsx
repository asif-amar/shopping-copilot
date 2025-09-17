import React, { useState, useEffect } from "react";
import "@/styles/global.css";
import { useChat } from "@/hooks/useChat";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Header, MessageList, ChatInput, OnboardingModal, UnauthorizedState, BetaWaitlistState } from "@/components";
import { AuthModal } from "@/components/AuthModal";
import { ConversationsDrawer } from "@/components/ConversationsDrawer";
import { ApiService } from "@/services/api";
import { UserPreferences } from "@/types/preferences";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState("");
  const [isBetaPending, setIsBetaPending] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log("🔍 Checking authentication status...");
    const authenticated = await ApiService.isAuthenticated();
    console.log("🔐 Authenticated:", authenticated);
    setIsAuthenticated(authenticated);
    
    // Check whitelist status if authenticated
    if (authenticated) {
      console.log("✅ User authenticated, checking whitelist status...");
      await checkWhitelistStatus();
    } else {
      console.log("❌ User not authenticated, showing auth modal");
      // Reset states when not authenticated
      setIsBetaPending(false);
      setIsUnauthorized(false);
      setUserEmail("");
    }
  };

  const checkWhitelistStatus = async () => {
    try {
      console.log("🔍 Checking whitelist status...");
      console.log("🔑 Auth token exists:", !!(await ApiService.isAuthenticated()));
      
      const whitelistStatus = await ApiService.getWhitelistStatus();
      console.log("📋 Whitelist status response:", whitelistStatus);
      setUserEmail(whitelistStatus.email);
      
      if (whitelistStatus.approved) {
        // User is approved - proceed with normal flow
        console.log("✅ User approved, proceeding to normal flow");
        setIsBetaPending(false);
        setIsUnauthorized(false);
        await checkOnboardingStatus();
      } else {
        // User is pending approval - show beta waitlist
        console.log("⏳ User pending approval, showing beta waitlist");
        setIsBetaPending(true);
        setIsUnauthorized(false);
        setIsAuthenticated(true); // Keep authenticated but show waitlist
      }
      
    } catch (error) {
      console.error("❌ Failed to check whitelist status:", error);
      console.error("❌ Error details:", {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      
      // If it's a 403 or access restricted error, show unauthorized state
      if (error instanceof Error && error.message.includes("Access restricted")) {
        console.log("🚫 Access restricted error, showing unauthorized state");
        setIsUnauthorized(true);
        setUnauthorizedMessage(error.message);
        setIsBetaPending(false);
        setIsAuthenticated(false);
      } else {
        // For other errors, show generic error
        console.log("⚠️ Generic error, showing unauthorized state");
        setIsUnauthorized(true);
        setUnauthorizedMessage("Unable to verify access. Please try again.");
        setIsBetaPending(false);
        setIsAuthenticated(false);
      }
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
      // Note: Whitelist errors are now handled in checkWhitelistStatus
    }
  };

  const handleSendMessage = async (message: string, preferences?: UserPreferences) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    // If user is in beta pending or unauthorized state, trigger status check
    if (isBetaPending || isUnauthorized) {
      console.log("🔄 User tried to send message while in restricted state, checking status...");
      await checkAuthStatus();
      return;
    }
    
    await sendMessage(message, preferences);
  };

  const handleAuthSuccess = async () => {
    console.log("🎉 handleAuthSuccess called - processing login...");
    
    // Reset all states
    setIsUnauthorized(false);
    setIsBetaPending(false);
    setUnauthorizedMessage("");
    setUserEmail("");
    
    // Multiple attempts to ensure auth check happens with more robust checking
    const attemptAuthCheck = async (attempt = 1, maxAttempts = 5) => {
      console.log(`🔄 Auth check attempt ${attempt}/${maxAttempts}`);
      
      try {
        // Progressive delay to allow token storage to complete
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        
        const authenticated = await ApiService.isAuthenticated();
        console.log(`🔐 Attempt ${attempt} - Authenticated:`, authenticated);
        
        if (authenticated) {
          console.log("✅ Authentication confirmed, calling checkAuthStatus...");
          setIsAuthenticated(true); // Set this immediately
          
          // Force call checkWhitelistStatus directly to ensure it happens
          console.log("🔍 Directly calling checkWhitelistStatus...");
          await checkWhitelistStatus();
        } else if (attempt < maxAttempts) {
          console.log(`⏳ Not authenticated yet, retrying attempt ${attempt + 1}...`);
          await attemptAuthCheck(attempt + 1, maxAttempts);
        } else {
          console.log("❌ Authentication failed after all attempts");
        }
      } catch (error) {
        console.error(`❌ Auth check attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          await attemptAuthCheck(attempt + 1, maxAttempts);
        }
      }
    };
    
    await attemptAuthCheck();
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
    console.log("🚪 Starting logout process...");
    
    // First call API signOut to clear all tokens
    try {
      await ApiService.signOut();
      console.log("✅ API signOut completed");
    } catch (error) {
      console.error("❌ Error during API signOut:", error);
    }
    
    // Reset all states to initial values
    setIsAuthenticated(false);
    setIsUnauthorized(false);
    setIsBetaPending(false);
    setUnauthorizedMessage("");
    setUserEmail("");
    setIsOnboardingModalOpen(false);
    
    await startNewConversation();
    // Refresh conversations list after sign out
    if (refreshConversations) {
      await refreshConversations();
    }
    
    console.log("🏁 Logout process completed - all states reset");
  };

  const handleRetryAuth = async () => {
    setIsUnauthorized(false);
    setUnauthorizedMessage("");
    await checkAuthStatus();
  };

  const handleCheckWhitelistStatus = async () => {
    setIsCheckingWhitelist(true);
    try {
      await checkWhitelistStatus();
    } finally {
      setIsCheckingWhitelist(false);
    }
  };

  // Show unauthorized state if user is not in whitelist
  if (isUnauthorized) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          currentHostname={currentHostname}
          onNewConversation={handleNewConversation}
          onOpenConversations={() => setIsConversationsDrawerOpen(true)}
          onSignOut={handleSignOut}
          onAuthSuccess={handleAuthSuccess}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <UnauthorizedState 
            message={unauthorizedMessage}
            onRetry={handleRetryAuth}
          />
        </div>
      </div>
    );
  }

  // Show beta waitlist state if user is pending approval
  if (isBetaPending) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          currentHostname={currentHostname}
          onNewConversation={handleNewConversation}
          onOpenConversations={() => setIsConversationsDrawerOpen(true)}
          onSignOut={handleSignOut}
          onAuthSuccess={handleAuthSuccess}
        />
        
        <div className="flex-1 overflow-y-auto">
          <BetaWaitlistState 
            userEmail={userEmail}
            onCheckStatus={handleCheckWhitelistStatus}
            isCheckingStatus={isCheckingWhitelist}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col bg-background"
    >
      <Header
        currentHostname={currentHostname}
        onNewConversation={handleNewConversation}
        onOpenConversations={() => setIsConversationsDrawerOpen(true)}
        onSignOut={handleSignOut}
        onAuthSuccess={handleAuthSuccess}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} currentHostname={currentHostname} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          console.log("🚪 Auth modal closed");
          setIsAuthModalOpen(false);
        }}
        onAuthSuccess={() => {
          console.log("🎯 Auth modal triggered onAuthSuccess");
          setIsAuthModalOpen(false);
          handleAuthSuccess();
        }}
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
        <Toaster />
      </LanguageProvider>
    </ThemeProvider>
  );
};
