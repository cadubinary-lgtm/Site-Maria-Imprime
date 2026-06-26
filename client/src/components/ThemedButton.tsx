import React from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemedButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}

/**
 * Button padronizado usando Design System
 * Garante consistência visual em todo o sistema
 */
export function ThemedButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  style = {},
  type = "button",
}: ThemedButtonProps) {
  const theme = useTheme();

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.primary.main,
      color: theme.colors.primary.foreground,
      border: "none",
    },
    secondary: {
      backgroundColor: theme.colors.accent.main,
      color: theme.colors.accent.foreground,
      border: "none",
    },
    outline: {
      backgroundColor: "transparent",
      color: theme.colors.primary.main,
      border: `2px solid ${theme.colors.primary.main}`,
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: `${theme.spacing.md} ${theme.spacing["4xl"]}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: `${theme.spacing.lg} ${theme.spacing["5xl"]}`,
      fontSize: theme.typography.fontSize.lg,
    },
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    borderRadius: theme.borderRadius.lg,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    boxShadow: theme.colors.shadow.sm,
    opacity: disabled ? 0.6 : 1,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      type={type}
      className={className}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = theme.colors.shadow.lg;
          if (variant === "primary") {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.primary.dark;
          } else if (variant === "secondary") {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.accent.dark;
          } else if (variant === "outline") {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.primary.main;
            (e.currentTarget as HTMLButtonElement).style.color = theme.colors.primary.foreground;
          }
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = theme.colors.shadow.sm;
        if (variant === "primary") {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.primary.main;
        } else if (variant === "secondary") {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.accent.main;
        } else if (variant === "outline") {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = theme.colors.primary.main;
        }
      }}
    >
      {children}
    </button>
  );
}

export default ThemedButton;
