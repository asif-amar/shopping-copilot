import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { ApiService } from '@/services/api';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  currentHostname: string;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    currentHostname: '',
  });

  // Load conversation when component mounts or hostname changes
  const loadConversation = useCallback(async (hostname: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONVERSATION',
        data: { hostname },
      });

      if (response.conversation) {
        const conversationMessages = response.conversation.messages.map(
          (msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })
        );
        setState(prev => ({ ...prev, messages: conversationMessages }));
      } else {
        setState(prev => ({ ...prev, messages: [] }));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setState(prev => ({ ...prev, messages: [] }));
    }
  }, []);

  // Get current hostname and load conversation
  const initializeConversation = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_HOSTNAME',
      });

      if (response.hostname) {
        setState(prev => ({ ...prev, currentHostname: response.hostname }));
        await loadConversation(response.hostname);
      }
    } catch (error) {
      console.error('Failed to get current hostname:', error);
    }
  }, [loadConversation]);

  // Listen for hostname changes from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'HOSTNAME_CHANGED') {
        const newHostname = message.data.hostname;
        setState(prev => ({ ...prev, currentHostname: newHostname }));
        loadConversation(newHostname);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    initializeConversation();

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [initializeConversation, loadConversation]);

  const saveMessage = useCallback(async (message: ChatMessage) => {
    if (!state.currentHostname) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_MESSAGE',
        data: {
          hostname: state.currentHostname,
          message,
        },
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [state.currentHostname]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading || !state.currentHostname) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      text: content.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Add message to UI immediately
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    // Save user message to storage
    await saveMessage(userMessage);

    try {
      // Pass hostname for website context
      const reader = await ApiService.sendMessage(content, state.currentHostname);
      const decoder = new TextDecoder();

      let assistantResponse = '';
      
      // Create initial bot message
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        text: '',
        isUser: false,
        timestamp: new Date(),
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parsedResult = ApiService.parseStreamChunk(chunk);
        
        if (parsedResult) {
          if (parsedResult.type === 'message' && parsedResult.content) {
            assistantResponse += parsedResult.content;
            
            // Update bot message in real-time
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, text: assistantResponse }
                  : msg
              ),
            }));
          } else if (parsedResult.type === 'action') {
            // Handle shopping action response
            const actionData = parsedResult.data;
            const actionText = `🛍️ Shopping Action: ${actionData.actionDescription}\n\n` +
              (actionData.success 
                ? `✅ Success: ${JSON.stringify(actionData.data, null, 2)}`
                : `❌ Error: ${actionData.error || 'Unknown error'}`);
            
            assistantResponse = actionText;
            
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, text: assistantResponse }
                  : msg
              ),
            }));
          }
        }
      }

      // Save final bot message to storage
      const finalBotMessage = { ...botMessage, text: assistantResponse };
      await saveMessage(finalBotMessage);

    } catch (error) {
      console.error('Failed to get response from backend:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentHostname, state.isLoading, saveMessage]);

  const clearConversation = useCallback(async () => {
    if (!confirm('Are you sure you want to clear this conversation?')) return;
    
    setState(prev => ({ ...prev, messages: [] }));

    if (state.currentHostname) {
      try {
        await chrome.runtime.sendMessage({
          type: 'CLEAR_CONVERSATION',
          data: { hostname: state.currentHostname },
        });
      } catch (error) {
        console.error('Failed to clear conversation:', error);
      }
    }
  }, [state.currentHostname]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    currentHostname: state.currentHostname,
    sendMessage,
    clearConversation,
  };
}