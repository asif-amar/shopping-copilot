import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, AlertCircle } from "lucide-react";

export interface ToolCallState {
  toolName: string;
  displayName: string;
  status: "running" | "completed" | "error";
  message?: string;
}

interface ToolCallProps {
  toolCall: ToolCallState;
}

export const ToolCall: React.FC<ToolCallProps> = ({ toolCall }) => {
  const [startTime] = useState(() => Date.now());
  const [displayStatus, setDisplayStatus] = useState<"running" | "completed" | "error">("running");

  useEffect(() => {
    if (toolCall.status === "completed" || toolCall.status === "error") {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime); // Minimum 500ms

      if (remainingTime > 0) {
        // Keep showing loading for the remaining time
        const timeout = setTimeout(() => {
          setDisplayStatus(toolCall.status);
        }, remainingTime);

        return () => clearTimeout(timeout);
      } else {
        // Enough time has passed, show the actual status immediately
        setDisplayStatus(toolCall.status);
      }
    } else {
      setDisplayStatus(toolCall.status);
    }
    return undefined;
  }, [toolCall.status, startTime]);
  const getStatusIcon = () => {
    switch (displayStatus) {
      case "running":
        return (
          <div className="text-indigo-500 dark:text-indigo-400 flex items-center w-3.5 h-3.5">
            <Loader2 
              size={14} 
              className="animate-spin"
            />
          </div>
        );
      case "completed":
        return <Check size={14} className="text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertCircle size={14} className="text-red-600 dark:text-red-400" />;
      default:
        return <Loader2 size={14} className="text-indigo-500 dark:text-indigo-400 animate-spin" />;
    }
  };


  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-muted/50 border border-border rounded-lg p-3 flex items-center gap-3 text-sm"
      style={{
        direction: "rtl",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Status Icon */}
      <div className="flex items-center min-w-[14px]">
        {getStatusIcon()}
      </div>

      {/* Tool Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-foreground ${toolCall.message ? "mb-0.5" : "mb-0"}`}>
          {toolCall.displayName}
        </div>
        {/* {toolCall.message && (
          <div style={{ 
            color: '#64748b', 
            fontSize: '13px',
            lineHeight: '1.3'
          }}>
            {toolCall.message}
          </div>
        )} */}
      </div>

      {/* Status Badge */}
      {/* <div
        style={{
          color: getStatusColor(),
          fontSize: "12px",
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}
      >
        {getStatusText()}
      </div> */}
    </motion.div>
  );
};
