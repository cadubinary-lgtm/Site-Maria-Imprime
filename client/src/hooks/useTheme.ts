import { theme } from "@/theme/designSystem";

/**
 * Hook para acessar o Design System em componentes
 * Facilita o uso centralizado de cores, tipografia e espaçamento
 */
export function useTheme() {
  return theme;
}

/**
 * Helpers para construir estilos com o Design System
 */
export const themeHelpers = {
  // Cores
  getColor: (colorPath: string) => {
    const keys = colorPath.split(".");
    let value: any = theme.colors;
    for (const key of keys) {
      value = value[key];
    }
    return value;
  },

  // Tipografia
  getHeadingStyle: (level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => ({
    fontFamily: theme.typography.fontFamily.primary,
    ...theme.typography.heading[level],
  }),

  getBodyStyle: (size: "large" | "base" | "small" | "xs" = "base") => ({
    fontFamily: theme.typography.fontFamily.primary,
    ...theme.typography.body[size],
  }),

  // Espaçamento
  getSpacing: (key: keyof typeof theme.spacing) => theme.spacing[key],

  // Componentes
  getButtonStyle: (variant: "primary" | "secondary" | "outline" = "primary") => ({
    fontFamily: theme.typography.fontFamily.primary,
    ...theme.components.button[variant],
  }),

  getCardStyle: (hover = false) => ({
    fontFamily: theme.typography.fontFamily.primary,
    ...theme.components.card.base,
    ...(hover && theme.components.card.hover),
  }),

  getInputStyle: () => ({
    ...theme.components.input.base,
  }),

  getSectionStyle: (compact = false) => ({
    fontFamily: theme.typography.fontFamily.primary,
    ...theme.components.section[compact ? "compact" : "base"],
  }),
};

export default useTheme;
