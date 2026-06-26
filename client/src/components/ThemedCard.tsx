import React from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Card padronizado usando Design System
 * Garante consistência visual em todo o sistema
 */
export function ThemedCard({ 
  children, 
  className = "", 
  hover = false, 
  onClick,
  style = {}
}: ThemedCardProps) {
  const theme = useTheme();

  const baseStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.colors.shadow.card,
    padding: theme.spacing["5xl"],
    border: `1px solid ${theme.colors.border.light}`,
    transition: "all 0.3s ease",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };

  const hoverStyle: React.CSSProperties = hover ? {
    boxShadow: theme.colors.shadow.hover,
    transform: "translateY(-4px)",
  } : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        ...hoverStyle,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default ThemedCard;
