import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatState } from "@/types/chat";
import { ApiService } from "@/services/api";
import { useLanguage } from "@/hooks/useLanguage";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  currentHostname: string;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { t } = useLanguage();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    currentHostname: "",
  });
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load conversation from backend API
  const loadConversation = useCallback(async (hostname: string) => {
    // For now, we'll create a new conversation per hostname session
    // In a more advanced implementation, we'd store the conversation ID per hostname
    try {
      const storedConversationId = localStorage.getItem(`conversation_${hostname}`);
      if (storedConversationId) {
        const response = await ApiService.getConversation(storedConversationId);
        if (response.conversation) {
          const conversationMessages = response.conversation.messages.map(
            (msg: any) => ({
              id: msg.id,
              text: msg.content,
              isUser: msg.role === "user",
              timestamp: new Date(msg.timestamp),
            })
          );
          setState((prev) => ({ ...prev, messages: conversationMessages }));
          setConversationId(storedConversationId);
          return;
        }
      }
      // If no conversation found, start fresh
      setState((prev) => ({ ...prev, messages: [] }));
      setConversationId(null);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setState((prev) => ({ ...prev, messages: [] }));
      setConversationId(null);
    }
  }, []);

  // Get current hostname and load conversation
  const initializeConversation = useCallback(async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        const hostname = url.hostname;
        setState((prev) => ({ ...prev, currentHostname: hostname }));
        await loadConversation(hostname);
      }
    } catch (error) {
      console.error("Failed to get current hostname:", error);
    }
  }, [loadConversation]);

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  // Save conversation ID for this hostname
  const saveConversationId = useCallback(
    (hostname: string, convId: string) => {
      localStorage.setItem(`conversation_${hostname}`, convId);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading || !state.currentHostname) return;

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        text: content.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      // Add message to UI immediately
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
      }));

      // User message will be saved by the backend when we send it

      try {
        // Pass hostname and conversation ID for context
        const reader = await ApiService.sendMessage(
          content,
          conversationId || undefined,
          state.currentHostname
        );
        const decoder = new TextDecoder();

        let assistantResponse = "";
        let botMessageAdded = false;
        let currentConversationId = conversationId;

        // Create bot message template (will be added on first content)
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          text: "",
          isUser: false,
          timestamp: new Date(),
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const parsedResult = ApiService.parseStreamChunk(chunk);

          if (parsedResult) {
            if (parsedResult.type === "conversation_info") {
              // Store the conversation ID for this session
              currentConversationId = parsedResult.conversationId;
              setConversationId(currentConversationId);
              saveConversationId(state.currentHostname, currentConversationId);
            } else if (parsedResult.type === "thinking") {
              // Show thinking indicator
              console.log("Thinking:", parsedResult.content);
            } else if (parsedResult.type === "message" && parsedResult.content) {
              assistantResponse += parsedResult.content;

              // Add bot message and hide loading indicator on first token
              if (!botMessageAdded) {
                botMessageAdded = true;
                setState((prev) => ({
                  ...prev,
                  isLoading: false,
                  messages: [
                    ...prev.messages,
                    { ...botMessage, text: assistantResponse },
                  ],
                }));
              } else {
                // Update existing bot message
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === botMessage.id
                      ? { ...msg, text: assistantResponse }
                      : msg
                  ),
                }));
              }
            } else if (parsedResult.type === "action") {
              // Handle shopping action response
              const actionData = parsedResult.data;
              const actionText =
                `🛍️ Shopping Action: ${actionData.actionDescription}\n\n` +
                (actionData.success
                  ? `✅ Success: ${JSON.stringify(actionData.data, null, 2)}`
                  : `❌ Error: ${actionData.error || "Unknown error"}`);

              assistantResponse = actionText;

              // Add bot message and hide loading indicator on action response
              if (!botMessageAdded) {
                botMessageAdded = true;
                setState((prev) => ({
                  ...prev,
                  isLoading: false,
                  messages: [
                    ...prev.messages,
                    { ...botMessage, text: assistantResponse },
                  ],
                }));
              } else {
                // Update existing bot message
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === botMessage.id
                      ? { ...msg, text: assistantResponse }
                      : msg
                  ),
                }));
              }
            } else if (parsedResult.type === "complete") {
              // Conversation completed
              console.log("Conversation completed");
            } else if (parsedResult.type === "error") {
              throw new Error(parsedResult.message);
            }
          }
        }
      } catch (error) {
        console.error("Failed to get response from backend:", error);

        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          text: t('error_occurred'),
          isUser: false,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          messages: [...prev.messages, errorMessage],
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.currentHostname, state.isLoading, conversationId, saveConversationId]
  );

  const startNewConversation = useCallback(async () => {
    setState((prev) => ({ ...prev, messages: [] }));
    setConversationId(null);

    if (state.currentHostname) {
      localStorage.removeItem(`conversation_${state.currentHostname}`);
    }
  }, [state.currentHostname]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    currentHostname: state.currentHostname,
    conversationId,
    sendMessage,
    startNewConversation,
  };
}
