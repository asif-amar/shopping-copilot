import React, { useState } from "react";
import { motion } from "framer-motion";

interface TooltipButtonProps {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  buttonStyle: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({ 
  children, 
  tooltip, 
  onClick, 
  buttonStyle, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={buttonStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </motion.button>
      <div
        style={{
          position: "absolute",
          bottom: "-35px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1px solid hsl(var(--border))",
          padding: "6px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "500",
          whiteSpace: "nowrap",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? "visible" : "hidden",
          transition: "opacity 0.2s ease, visibility 0.2s ease",
        }}
      >
        {tooltip}
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "0",
            height: "0",
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderBottom: "4px solid hsl(var(--popover))",
          }}
        />
      </div>
    </div>
  );
};