import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ApiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  title: string;
  hostname: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface ConversationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string) => void;
  preloadConversations?: boolean;
  onRefreshConversations?: (refreshFn: () => Promise<void>) => void;
}

export const ConversationsDrawer: React.FC<ConversationsDrawerProps> = ({
  isOpen,
  onClose,
  onLoadConversation,
  preloadConversations = false,
  onRefreshConversations,
}) => {
  const { isRTL, t, language } = useLanguage();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen || preloadConversations) {
      fetchConversations();
    }
  }, [isOpen, preloadConversations]);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshConversations) {
      onRefreshConversations(fetchConversations);
    }
  }, [onRefreshConversations]);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ApiService.listConversations(20);
      // Transform backend response to our interface
      const formattedConversations: ConversationItem[] =
        response.conversations.map((conv: any) => ({
          id: conv.id,
          title:
            conv.title ||
            `${conv.hostname} - ${new Date(conv.updated_at).toLocaleDateString()}`,
          hostname: conv.hostname || "Unknown",
          lastMessage:
            conv.messages?.[conv.messages.length - 1]?.content?.slice(0, 80) +
              "..." || "No messages",
          timestamp: new Date(
            conv.updated_at || conv.created_at
          ).toLocaleString(),
          messageCount: conv.messages?.length || 0,
        }));
      setConversations(
        formattedConversations.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    onLoadConversation(conversationId);
    onClose();
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return language === "he" ? "עכשיו" : "Just now";
    }

    if (diffMinutes < 60) {
      if (language === "he") return `לפני ${diffMinutes} דקות`;
      return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
      if (language === "he") return `לפני ${diffHours} שעות`;
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      if (language === "he") return `לפני ${diffDays} ימים`;
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: isRTL ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed top-0 bottom-0 w-80 max-w-[90vw] bg-white shadow-xl z-50 flex flex-col",
              isRTL
                ? "right-0 border-l border-slate-200"
                : "left-0 border-r border-slate-200"
            )}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-800">
                  {t("conversations") || "Conversations"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">
                      {t("loading") || "Loading..."}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={fetchConversations}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
                  >
                    {t("retry") || "Retry"}
                  </button>
                </div>
              )}

              {!isLoading && !error && conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare size={48} className="text-slate-300 mb-4" />
                  <h3 className="text-slate-600 font-medium mb-2">
                    {t("no_conversations") || "No conversations yet"}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {t("start_chatting_desc") ||
                      "Start chatting to see your conversation history here"}
                  </p>
                </div>
              )}

              {!isLoading && !error && conversations.length > 0 && (
                <div className="">
                  {conversations.map((conversation, index) => (
                    <motion.button
                      key={conversation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0",
                        "flex items-center justify-between group"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-800 truncate">
                            {conversation.title}
                          </h4>
                          {/* <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {conversation.messageCount}
                          </span> */}
                        </div>
                        {/* <p className="text-xs text-slate-500 truncate mb-1">
                          {conversation.lastMessage}
                        </p> */}
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} />
                          <span>
                            {formatRelativeTime(conversation.timestamp)}
                          </span>
                          {/* <span className="mx-1">•</span>
                          <span className="truncate">
                            {conversation.hostname}
                          </span> */}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={cn(
                          "text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0",
                          isRTL && "rotate-180"
                        )}
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={fetchConversations}
                  className="w-full py-2 px-3 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("refresh") || "Refresh"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
