import { useState, useEffect, useCallback } from "react";
import {
  ChatMessage,
  MessagePartType,
  TextPart,
  ToolCallPart,
  ProductsPart,
  Product,
} from "@/types/chat";
import { ApiService } from "@/services/api";
import { useLanguage } from "@/hooks/useLanguage";
import { getToolDisplayName } from "@/utils/toolCallParser";
import { UserPreferences } from "@/types/preferences";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  currentHostname: string;
  conversationId: string | null;
  sendMessage: (content: string, preferences?: UserPreferences) => Promise<void>;
  startNewConversation: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
}

/**
 * Stream content parser that handles the raw agent responses
 * and converts them into structured message parts while preserving order
 */
class StreamContentParser {
  private textBuffer: string = "";
  private currentParts: MessagePartType[] = [];

  /**
   * Process a chunk of content and return updated message parts
   */
  processChunk(content: string): MessagePartType[] {
    this.textBuffer += content;
    console.log("🔍 Processing chunk:", content);
    console.log("📦 Current buffer:", this.textBuffer);
    return this._parseBuffer();
  }

  /**
   * Get the final parts after processing all content
   */
  getfinalParts(): MessagePartType[] {
    console.log("🏁 Finalizing with buffer:", this.textBuffer);

    // Flush any remaining text
    if (this.textBuffer.trim()) {
      this._addTextPart(this.textBuffer);
      this.textBuffer = "";
    }

    // Products are always ready for display (no loading state needed)
    const productsPart = this.currentParts.find(
      (part) => part.type === "products"
    ) as ProductsPart | undefined;
    if (productsPart) {
      console.log(
        "✅ Stream complete with",
        productsPart.products.length,
        "total products"
      );
    }

    return this.currentParts;
  }

  private _parseBuffer(): MessagePartType[] {
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 50; // Prevent infinite loops

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      console.log(
        `🔄 Parse iteration ${iterations}, buffer length: ${this.textBuffer.length}`
      );

      // Look for complete individual product tags
      const productTagMatch = this.textBuffer.match(
        /<product>(.*?)<\/product>/s
      );

      if (productTagMatch) {
        console.log("✅ Found complete product tag");
        const [fullMatch, productContent] = productTagMatch;
        const beforeTag = this.textBuffer.substring(
          0,
          this.textBuffer.indexOf(fullMatch)
        );
        const afterTag = this.textBuffer.substring(
          this.textBuffer.indexOf(fullMatch) + fullMatch.length
        );

        // Add text before the tag if any
        if (beforeTag.trim()) {
          console.log(
            "📝 Adding text before product tag:",
            beforeTag.substring(0, 50) + "..."
          );
          this._addTextPart(beforeTag);
        }

        // Parse and add individual product
        console.log("📦 Processing individual product");
        this._handleIndividualProduct(productContent);

        // Continue with remaining content
        this.textBuffer = afterTag;
        hasChanges = true;
        continue;
      }

      // Check for incomplete product tags - keep them in buffer
      const openProductIndex = this.textBuffer.lastIndexOf("<product>");
      const closeProductIndex = this.textBuffer.indexOf("</product>");

      if (openProductIndex !== -1 && closeProductIndex === -1) {
        // We have an opening product tag but no closing tag - keep everything from the opening tag
        console.log(
          "⏸️ Found incomplete product tag, keeping in buffer from position:",
          openProductIndex
        );
        const beforeIncomplete = this.textBuffer.substring(0, openProductIndex);
        if (beforeIncomplete.trim()) {
          this._addTextPart(beforeIncomplete);
        }
        this.textBuffer = this.textBuffer.substring(openProductIndex);
        break; // Wait for more content
      }

      // Check if we might have a partial opening product tag at the end
      const potentialProductStart = this.textBuffer.match(/<product?$/);
      if (potentialProductStart) {
        console.log(
          "⏸️ Found potential partial product tag start, keeping in buffer"
        );
        const beforePotential = this.textBuffer.substring(
          0,
          potentialProductStart.index
        );
        if (beforePotential.trim()) {
          this._addTextPart(beforePotential);
        }
        this.textBuffer = this.textBuffer.substring(
          potentialProductStart.index!
        );
        break; // Wait for more content
      }

      // Legacy support: Look for complete product_search_results wrapper (optional)
      const wrapperTagMatch = this.textBuffer.match(
        /<product_search_results>(.*?)<\/product_search_results>/s
      );
      if (wrapperTagMatch) {
        console.log(
          "✅ Found legacy product_search_results wrapper, extracting products"
        );
        const [fullMatch, wrapperContent] = wrapperTagMatch;
        const beforeTag = this.textBuffer.substring(
          0,
          this.textBuffer.indexOf(fullMatch)
        );
        const afterTag = this.textBuffer.substring(
          this.textBuffer.indexOf(fullMatch) + fullMatch.length
        );

        // Add text before the tag if any
        if (beforeTag.trim()) {
          this._addTextPart(beforeTag);
        }

        // Extract individual products from wrapper
        const productMatches = wrapperContent.matchAll(
          /<product>(.*?)<\/product>/gs
        );
        for (const match of productMatches) {
          this._handleIndividualProduct(match[1]);
        }

        // Continue with remaining content
        this.textBuffer = afterTag;
        hasChanges = true;
        continue;
      }

      // No product tags found, process as regular text
      if (this.textBuffer.trim()) {
        console.log(
          "📝 Adding remaining text:",
          this.textBuffer.substring(0, 50) + "..."
        );
        this._addTextPart(this.textBuffer);
        this.textBuffer = "";
      }
      break;
    }

    return this.currentParts;
  }

  private _addTextPart(content: string): void {
    const trimmedContent = content; //.trim();
    if (!trimmedContent) return;

    // Check if the last part is a text part and merge if so
    const lastPart = this.currentParts[this.currentParts.length - 1];
    if (lastPart && lastPart.type === "text") {
      (lastPart as TextPart).content += trimmedContent;
    } else {
      // Create new text part
      const textPart: TextPart = {
        type: "text",
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        content: trimmedContent,
      };
      this.currentParts.push(textPart);
    }
  }

  private _handleIndividualProduct(productContent: string): void {
    try {
      console.log(
        "📦 Parsing individual product JSON:",
        productContent.substring(0, 100) + "..."
      );
      const product: Product = JSON.parse(productContent);
      console.log("✅ Successfully parsed product:", product.name);

      // Find existing products part or create new one
      let productsPart = this.currentParts.find(
        (part) => part.type === "products"
      ) as ProductsPart | undefined;

      if (!productsPart) {
        // Create new products part - no loading state, show products immediately
        productsPart = {
          type: "products",
          id: `products_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          products: [],
          isLoading: false, // Always false - show products immediately
        };
        this.currentParts.push(productsPart);
        console.log("🆕 Created new products part");
      }

      // Add product to existing array (create new array for React to detect change)
      productsPart.products = [...productsPart.products, product];
      console.log(
        "✅ Added product to part, total products:",
        productsPart.products.length
      );
    } catch (error) {
      console.error("❌ Failed to parse individual product JSON:", error);
      console.error("❌ Problem JSON:", productContent);
    }
  }

  /**
   * Add or update a tool call part
   */
  addToolCall(
    toolName: string,
    state: "started" | "completed" | "error"
  ): void {
    // Find existing tool call or create new one
    const existingToolCall = this.currentParts.find(
      (part) =>
        part.type === "tool-call" &&
        (part as ToolCallPart).toolName === toolName
    ) as ToolCallPart | undefined;

    if (existingToolCall) {
      existingToolCall.state = state;
    } else {
      const toolCallPart: ToolCallPart = {
        type: "tool-call",
        id: `tool_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        toolName,
        displayName: getToolDisplayName(toolName),
        state,
      };
      this.currentParts.push(toolCallPart);
    }
  }

  /**
   * Reset the parser state for processing a new message
   */
  reset(): void {
    this.textBuffer = "";
    this.currentParts = [];
  }
}

export function useChat(): UseChatReturn {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentHostname, setCurrentHostname] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Initialize and get current hostname
  useEffect(() => {
    const initializeHostname = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.url) {
          const url = new URL(tabs[0].url);
          const hostname = url.hostname;
          setCurrentHostname(hostname);
        }
      } catch (error) {
        console.error("Failed to initialize hostname:", error);
      }
    };

    initializeHostname();
  }, []);

  // Load stored conversation when hostname is available
  useEffect(() => {
    if (!currentHostname) return;
    
    const loadStoredConversation = async () => {
      const storedConversationId = localStorage.getItem(
        `conversation_${currentHostname}`
      );
      if (storedConversationId) {
        try {
          setIsLoading(true);
          const response = await ApiService.getConversation(storedConversationId);
          
          if (response.messages && Array.isArray(response.messages)) {
            // Convert backend messages to frontend ChatMessage format (same as loadConversation)
            const loadedMessages: ChatMessage[] = response.messages.map((msg: any) => {
              const isUser = msg.sender === "human";
              const parts: MessagePartType[] = [];
              
              if (isUser) {
                // User messages have simple text content
                parts.push({
                  type: "text",
                  id: `text_${msg.id}`,
                  content: msg.content || "",
                });
              } else {
                // Assistant messages have content array
                if (!msg.content || !Array.isArray(msg.content)) {
                  console.warn("Invalid assistant message content structure:", msg);
                  return null;
                }
                
                // Process content array to preserve order
                let currentProducts: any[] = [];
                
                msg.content.forEach((contentItem: any, index: number) => {
                  switch (contentItem.type) {
                    case "text":
                      // If we have accumulated products, add them first
                      if (currentProducts.length > 0) {
                        parts.push({
                          type: "products",
                          id: `products_${msg.id}_${parts.length}`,
                          products: currentProducts,
                          isLoading: false
                        });
                        currentProducts = [];
                      }
                      
                      // Add text part
                      if (contentItem.text && contentItem.text.trim()) {
                        parts.push({
                          type: "text",
                          id: `text_${msg.id}_${index}`,
                          content: contentItem.text.trim(),
                        });
                      }
                      break;
                      
                    case "tool":
                      // If we have accumulated products, add them first
                      if (currentProducts.length > 0) {
                        parts.push({
                          type: "products",
                          id: `products_${msg.id}_${parts.length}`,
                          products: currentProducts,
                          isLoading: false
                        });
                        currentProducts = [];
                      }
                      
                      // Add tool call part
                      parts.push({
                        type: "tool-call",
                        id: `tool_${msg.id}_${index}`,
                        toolName: contentItem.tool,
                        displayName: getToolDisplayName(contentItem.tool),
                        state: "completed"
                      });
                      break;
                      
                    case "product":
                      // Accumulate products to group them together
                      if (contentItem.product) {
                        currentProducts.push(contentItem.product);
                      }
                      break;
                      
                    default:
                      console.warn("Unknown content type:", contentItem.type);
                  }
                });
                
                // Add any remaining accumulated products
                if (currentProducts.length > 0) {
                  parts.push({
                    type: "products",
                    id: `products_${msg.id}_${parts.length}`,
                    products: currentProducts,
                    isLoading: false
                  });
                }
              }
              
              return {
                id: msg.id,
                parts,
                isUser,
                timestamp: new Date(msg.timestamp),
                isComplete: true,
              };
            }).filter(Boolean); // Remove null entries
            
            setMessages(loadedMessages);
            setConversationId(storedConversationId);
          }
        } catch (error) {
          console.error("Failed to load stored conversation:", error);
          // Clear invalid stored conversation ID
          localStorage.removeItem(`conversation_${currentHostname}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStoredConversation();
  }, [currentHostname]);

  const sendMessage = useCallback(
    async (content: string, preferences?: UserPreferences) => {
      if (!content.trim() || isLoading || !currentHostname) return;

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        parts: [
          {
            type: "text",
            id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            content: content.trim(),
          },
        ],
        isUser: true,
        timestamp: new Date(),
        isComplete: true,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const reader = await ApiService.sendMessage(
          content,
          conversationId || undefined,
          currentHostname,
          preferences
        );
        const decoder = new TextDecoder();

        // Create bot message and parser
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          parts: [],
          isUser: false,
          timestamp: new Date(),
          isComplete: false,
        };

        const parser = new StreamContentParser();
        let currentConversationId = conversationId;
        let hasReceivedContent = false; // Track if we've received any content yet

        // Add bot message to state (keep loading until we receive actual content)
        setMessages((prev) => [...prev, botMessage]);
        // Don't set isLoading(false) here - wait for actual content

        // Process stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const parsedEvent = ApiService.parseStreamChunk(chunk);

          if (!parsedEvent) continue;

          console.log("📨 Stream event:", parsedEvent.type, parsedEvent);

          switch (parsedEvent.type) {
            case "conversation_info":
              currentConversationId = parsedEvent.conversationId;
              setConversationId(currentConversationId);
              localStorage.setItem(
                `conversation_${currentHostname}`,
                currentConversationId
              );
              break;

            case "tool":
              if (parsedEvent.content) {
                const isCompleted = parsedEvent.content.includes("_completed");
                const isStarted = parsedEvent.content.includes("_started");

                if (isStarted || isCompleted) {
                  const toolName = parsedEvent.content.replace(
                    /_(?:started|completed)$/,
                    ""
                  );
                  const state = isCompleted ? "completed" : "started";

                  // Hide typing indicator when first content appears
                  if (!hasReceivedContent) {
                    setIsLoading(false);
                    hasReceivedContent = true;
                  }

                  parser.addToolCall(toolName, state);

                  // Update bot message with current parts
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessage.id
                        ? { ...msg, parts: [...parser.processChunk("")] }
                        : msg
                    )
                  );

                  // Handle cart operations page refresh
                  if (
                    state === "completed" &&
                    [
                      "add_to_cart",
                      "remove_from_cart",
                      "update_cart_quantity",
                    ].includes(toolName)
                  ) {
                    try {
                      const tabs = await chrome.tabs.query({
                        active: true,
                        currentWindow: true,
                      });
                      if (tabs[0]?.id) {
                        chrome.tabs.reload(tabs[0].id);
                      }
                    } catch (error) {
                      console.error(
                        "Failed to refresh page after cart operation:",
                        error
                      );
                    }
                  }
                }
              }
              break;

            case "thinking":
              // Log thinking steps but don't display them
              console.log("💭", parsedEvent.content);
              break;

            case "message":
              if (parsedEvent.content) {
                // Hide typing indicator when first content appears
                if (!hasReceivedContent) {
                  setIsLoading(false);
                  hasReceivedContent = true;
                }

                // Process content and update bot message
                const updatedParts = parser.processChunk(parsedEvent.content);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessage.id
                      ? { ...msg, parts: [...updatedParts] }
                      : msg
                  )
                );
              }
              break;

            case "complete":
              // Finalize the message
              const finalParts = parser.getfinalParts();
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessage.id
                    ? { ...msg, parts: [...finalParts], isComplete: true }
                    : msg
                )
              );
              console.log("✅ Stream completed");
              break;

            case "error":
              console.error("❌ Stream error:", parsedEvent.message);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessage.id
                    ? {
                        ...msg,
                        parts: [
                          {
                            type: "text",
                            id: `error_${Date.now()}`,
                            content: `Error: ${parsedEvent.message}`,
                          },
                        ],
                        isComplete: true,
                      }
                    : msg
                )
              );
              break;
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);

        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          parts: [
            {
              type: "text",
              id: `error_text_${Date.now()}`,
              content: t("error_occurred") || "An error occurred",
            },
          ],
          isUser: false,
          timestamp: new Date(),
          isComplete: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, currentHostname, conversationId, t]
  );

  const startNewConversation = useCallback(async () => {
    setMessages([]);
    setConversationId(null);
    if (currentHostname) {
      localStorage.removeItem(`conversation_${currentHostname}`);
    }
  }, [currentHostname]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setMessages([]); // Clear existing messages
      
      const response = await ApiService.getConversation(conversationId);
      
      if (!response.messages || !Array.isArray(response.messages)) {
        console.error("Invalid conversation response:", response);
        return;
      }
      
      // Convert backend messages to frontend ChatMessage format
      const loadedMessages: ChatMessage[] = response.messages.map((msg: any) => {
        const isUser = msg.sender === "human";
        const parts: MessagePartType[] = [];
        
        if (isUser) {
          // User messages have simple text content
          parts.push({
            type: "text",
            id: `text_${msg.id}`,
            content: msg.content || "",
          });
        } else {
          // Assistant messages have content array
          if (!msg.content || !Array.isArray(msg.content)) {
            console.warn("Invalid assistant message content structure:", msg);
            return null;
          }
          
          // Process content array to preserve order
          let currentProducts: any[] = [];
          
          msg.content.forEach((contentItem: any, index: number) => {
            switch (contentItem.type) {
              case "text":
                // If we have accumulated products, add them first
                if (currentProducts.length > 0) {
                  parts.push({
                    type: "products",
                    id: `products_${msg.id}_${parts.length}`,
                    products: currentProducts,
                    isLoading: false
                  });
                  currentProducts = [];
                }
                
                // Add text part
                if (contentItem.text && contentItem.text.trim()) {
                  parts.push({
                    type: "text",
                    id: `text_${msg.id}_${index}`,
                    content: contentItem.text.trim(),
                  });
                }
                break;
                
              case "tool":
                // If we have accumulated products, add them first
                if (currentProducts.length > 0) {
                  parts.push({
                    type: "products",
                    id: `products_${msg.id}_${parts.length}`,
                    products: currentProducts,
                    isLoading: false
                  });
                  currentProducts = [];
                }
                
                // Add tool call part
                parts.push({
                  type: "tool-call",
                  id: `tool_${msg.id}_${index}`,
                  toolName: contentItem.tool,
                  displayName: getToolDisplayName(contentItem.tool),
                  state: "completed" // Loaded conversations show completed tools
                });
                break;
                
              case "product":
                // Accumulate products to group them together
                if (contentItem.product) {
                  currentProducts.push(contentItem.product);
                }
                break;
                
              default:
                console.warn("Unknown content type:", contentItem.type);
            }
          });
          
          // Add any remaining accumulated products
          if (currentProducts.length > 0) {
            parts.push({
              type: "products",
              id: `products_${msg.id}_${parts.length}`,
              products: currentProducts,
              isLoading: false
            });
          }
        }
        
        return {
          id: msg.id,
          parts,
          isUser,
          timestamp: new Date(msg.timestamp),
          isComplete: true,
        };
      }).filter(Boolean); // Remove null entries
      
      // Set conversation ID and update localStorage
      setConversationId(conversationId);
      if (currentHostname) {
        localStorage.setItem(`conversation_${currentHostname}`, conversationId);
      }
      
      // Update messages
      setMessages(loadedMessages);
      console.log("✅ Conversation loaded successfully with", loadedMessages.length, "messages");
      
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentHostname]);

  return {
    messages,
    isLoading,
    currentHostname,
    conversationId,
    sendMessage,
    startNewConversation,
    loadConversation,
  };
}
