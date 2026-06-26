import React from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemedInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
}

/**
 * Input padronizado usando Design System
 * Garante consistência visual em todo o sistema
 */
export function ThemedInput({
  type = "text",
  placeholder = "",
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  className = "",
  style = {},
  name,
  id,
  required = false,
  autoComplete,
}: ThemedInputProps) {
  const theme = useTheme();

  const baseStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: theme.typography.fontSize.base,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderRadius: theme.borderRadius.lg,
    border: `1.5px solid ${theme.colors.border.light}`,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.neutral.textDarker,
    transition: "all 0.3s ease",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    ...style,
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary.main;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary.main}20`;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border.light;
        e.currentTarget.style.boxShadow = "none";
        onBlur?.(e);
      }}
      disabled={disabled}
      className={className}
      style={baseStyle}
      name={name}
      id={id}
      required={required}
      autoComplete={autoComplete}
    />
  );
}

export default ThemedInput;
