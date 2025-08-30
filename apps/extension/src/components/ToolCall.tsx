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
  }, [toolCall.status, startTime]);
  const getStatusIcon = () => {
    switch (displayStatus) {
      case "running":
        return (
          <div style={{ 
            color: "#6366f1", 
            display: "flex", 
            alignItems: "center",
            width: "14px",
            height: "14px"
          }}>
            <Loader2 
              size={14} 
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        );
      case "completed":
        return <Check size={14} style={{ color: "#059669" }} />;
      case "error":
        return <AlertCircle size={14} style={{ color: "#dc2626" }} />;
    }
  };


  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        direction: "rtl",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Status Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: "14px",
        }}
      >
        {getStatusIcon()}
      </div>

      {/* Tool Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: "500",
            color: "#1e293b",
            marginBottom: toolCall.message ? "2px" : 0,
          }}
        >
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
