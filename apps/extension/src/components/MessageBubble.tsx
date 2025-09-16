import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import {
  ChatMessage,
  TextPart,
  ToolCallPart,
  ProductsPart,
  CartItemsPart,
} from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolCall } from "./ToolCall";
import { ProductGrid } from "./ProductGrid";
import { CartItemList } from "./CartItemList";
import { useLanguage } from "@/hooks/useLanguage";

interface MessageBubbleProps {
  message: ChatMessage;
  onSendMessage?: (message: string) => Promise<void>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSendMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const { language } = useLanguage();

  // Check if message has any visible content
  const hasVisibleContent = () => {
    return message.parts.some((part) => {
      if (part.type === "text") {
        return (part as TextPart).content?.trim();
      } else if (part.type === "products") {
        return (part as ProductsPart).products.length > 0;
      } else if (part.type === "cart-items") {
        return (part as CartItemsPart).items.length > 0;
      } else if (part.type === "tool-call") {
        return true; // Tool calls are always visible
      }
      return false;
    });
  };

  // Don't render if no visible content
  if (!hasVisibleContent()) {
    return null;
  }

  const formatTime = (date: Date) => {
    if (language === "he") {
      return date.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  };

  // Helper function to extract all text content from parts
  const getTextContent = () => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as TextPart).content)
      .join(" ");
  };

  const handleCopy = async () => {
    try {
      // Copy all text content from parts
      const textToCopy = getTextContent();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false); // Clear dislike if set
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false); // Clear like if set
  };

  // Handle cart item deletion
  const handleDeleteCartItem = async (
    _cartItemId: string,
    itemName: string,
    _quantity: number
  ) => {
    if (!onSendMessage) return;

    // Create delete message in the appropriate language using product name
    const deleteMessage =
      language === "he"
        ? `הסר את "${itemName}" מהעגלה`
        : `Remove "${itemName}" from cart`;

    // Send the delete message through the chat system
    await onSendMessage(deleteMessage);
  };

  // Handle add to cart
  const handleAddToCart = async (productName: string): Promise<void> => {
    if (!onSendMessage) return;

    const addMessage =
      language === "he"
        ? `הוסף את "${productName}" לעגלה`
        : `Add "${productName}" to cart`;

    await onSendMessage(addMessage);
  };

  if (message.isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <div
          className="max-w-[70%] bg-purple-600 text-white p-3 rounded-2xl text-sm leading-relaxed"
          style={{
            direction: isHebrew(getTextContent()) ? "rtl" : "ltr",
            textAlign: isHebrew(getTextContent()) ? "right" : "left",
          }}
        >
          {getTextContent()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: language === "he" ? "flex-end" : "flex-start",
        width: "85%",
        marginBottom: "16px",
      }}
    >
      {/* Render message parts directly */}
      {message.parts.map((part, index) => {
        if (part.type === "text" && (part as TextPart).content?.trim()) {
          const textPart = part as TextPart;
          return (
            <div
              key={part.id}
              className="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
              style={{
                direction: isHebrew(textPart.content) ? "rtl" : "ltr",
                textAlign: isHebrew(textPart.content) ? "right" : "left",
                marginBottom: index < message.parts.length - 1 ? "8px" : "0",
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[]}
                skipHtml={false}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (href) {
                          chrome.tabs.update({ url: href });
                        }
                      }}
                      style={{
                        color: "#3b82f6",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || "Product image"}
                      style={{
                        maxWidth: "150px",
                        maxHeight: "150px",
                        borderRadius: "8px",
                        marginTop: "8px",
                        marginBottom: "8px",
                        objectFit: "cover",
                        border: "1px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ),
                }}
              >
                {textPart.content}
              </ReactMarkdown>
            </div>
          );
        } else if (part.type === "tool-call") {
          const toolCallPart = part as ToolCallPart;
          return (
            <div
              key={part.id}
              style={{
                // maxWidth: "85%",
                marginBottom: index < message.parts.length - 1 ? "8px" : "0",
              }}
            >
              <ToolCall
                toolCall={{
                  toolName: toolCallPart.toolName,
                  displayName: toolCallPart.displayName,
                  status:
                    toolCallPart.state === "started" ? "running" : "completed",
                }}
              />
            </div>
          );
        } else if (part.type === "products") {
          const productsPart = part as ProductsPart;
          return (
            <div
              key={part.id}
              style={{
                width: "100%",
                maxWidth: "none",
                marginBottom: index < message.parts.length - 1 ? "16px" : "0",
              }}
            >
              <ProductGrid
                products={productsPart.products}
                isLoading={false}
                onAddToCart={onSendMessage ? handleAddToCart : undefined}
              />
            </div>
          );
        } else if (part.type === "cart-items") {
          const cartItemsPart = part as CartItemsPart;
          return (
            <div
              key={part.id}
              style={{
                width: "100%",
                maxWidth: "none",
                marginBottom: index < message.parts.length - 1 ? "16px" : "0",
              }}
            >
              <CartItemList
                items={cartItemsPart.items}
                isLoading={false}
                onDeleteItem={onSendMessage ? handleDeleteCartItem : undefined}
              />
            </div>
          );
        }
        return null;
      })}

      {message.isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "8px",
            alignItems: "center",
            flexDirection: language === "he" ? "row-reverse" : "row",
          }}
        >
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded border-none cursor-pointer flex items-center justify-center transition-all duration-200 ${
              copied 
                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" 
                : "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title={copied ? "Copied!" : "Copy message"}
          >
            <motion.div
              initial={false}
              animate={{ scale: copied ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </motion.div>
          </motion.button>

          <motion.button
            onClick={handleLike}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded border-none cursor-pointer flex items-center justify-center transition-all duration-200 ${
              liked 
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                : "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Like message"
          >
            <motion.div
              animate={{
                scale: liked ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
            </motion.div>
          </motion.button>

          <motion.button
            onClick={handleDislike}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-1.5 rounded border-none cursor-pointer flex items-center justify-center transition-all duration-200 ${
              disliked 
                ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" 
                : "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Dislike message"
          >
            <motion.div
              animate={{
                scale: disliked ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <ThumbsDown size={16} fill={disliked ? "currentColor" : "none"} />
            </motion.div>
          </motion.button>

          <span
            className="text-xs text-muted-foreground ml-2"
          >
            {formatTime(message.timestamp)}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
