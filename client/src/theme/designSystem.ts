/**
 * Design System Global
 * Centraliza todas as cores, tipografia, espaçamento e estilos do sistema
 * Baseado na identidade visual da Home (Maria Imprime)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORES
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Primária: Rosa Magenta
  primary: {
    main: "#E91E63",
    light: "#F06292",
    lighter: "#F48FB1",
    dark: "#C2185B",
    darker: "#880E4F",
    foreground: "#FFFFFF",
  },

  // Laranja (Destaque secundário)
  accent: {
    main: "#FF6B35",
    light: "#FF8A5B",
    lighter: "#FFB088",
    dark: "#E55100",
    darker: "#BF360C",
    foreground: "#FFFFFF",
  },

  // Neutros
  neutral: {
    white: "#FFFFFF",
    offWhite: "#F9FAFB",
    lightGray: "#F3F4F6",
    gray: "#E5E7EB",
    mediumGray: "#D1D5DB",
    darkGray: "#9CA3AF",
    textLight: "#6B7280",
    textMedium: "#4B5563",
    textDark: "#374151",
    textDarker: "#111827",
    black: "#000000",
  },

  // Estados
  success: {
    main: "#10B981",
    light: "#6EE7B7",
    foreground: "#FFFFFF",
  },
  warning: {
    main: "#F59E0B",
    light: "#FCD34D",
    foreground: "#FFFFFF",
  },
  error: {
    main: "#EF4444",
    light: "#FCA5A5",
    foreground: "#FFFFFF",
  },
  info: {
    main: "#3B82F6",
    light: "#93C5FD",
    foreground: "#FFFFFF",
  },

  // Backgrounds
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F3F4F6",
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Borders
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },

  // Shadows (OKLCH format para Tailwind 4)
  shadow: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    card: "0 2px 12px rgba(0, 0, 0, 0.06)",
    hover: "0 8px 20px rgba(0, 0, 0, 0.12)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOGRAFIA
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    primary: "'Bahnschrift', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    secondary: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Courier New', monospace",
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },

  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.02em",
    wider: "0.05em",
  },

  // Estilos predefinidos
  heading: {
    h1: {
      fontSize: "clamp(2.6rem, 4vw, 3.8rem)",
      fontWeight: 900,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "clamp(1.875rem, 3vw, 2.25rem)",
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.875rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
  },

  body: {
    large: {
      fontSize: "1.05rem",
      fontWeight: 400,
      lineHeight: 1.6,
    },
    base: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.6,
    },
    small: {
      fontSize: "0.95rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    xs: {
      fontSize: "0.85rem",
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },

  label: {
    large: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    base: {
      fontSize: "0.95rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    small: {
      fontSize: "0.85rem",
      fontWeight: 500,
      lineHeight: 1.4,
    },
  },

  caption: {
    fontSize: "0.78rem",
    fontWeight: 400,
    lineHeight: 1.3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ESPAÇAMENTO
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "28px",
  "4xl": "32px",
  "5xl": "36px",
  "6xl": "40px",
  "7xl": "44px",
  "8xl": "48px",
  "9xl": "52px",
  "10xl": "56px",
  "12xl": "64px",
  "16xl": "80px",
  "20xl": "96px",
  "24xl": "112px",
};

export const containerPadding = {
  mobile: "16px",
  tablet: "24px",
  desktop: "48px",
};

export const containerMaxWidth = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const borderRadius = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "20px",
  full: "9999px",
  pill: "50px",
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES PREDEFINIDOS
// ═══════════════════════════════════════════════════════════════════════════

export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary.main,
      color: colors.primary.foreground,
      padding: `${spacing.md} ${spacing["4xl"]}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "none",
      boxShadow: colors.shadow.sm,
      "&:hover": {
        backgroundColor: colors.primary.dark,
        boxShadow: colors.shadow.lg,
      },
      "&:active": {
        backgroundColor: colors.primary.darker,
      },
    },

    secondary: {
      backgroundColor: colors.accent.main,
      color: colors.accent.foreground,
      padding: `${spacing.md} ${spacing["4xl"]}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "none",
      boxShadow: colors.shadow.sm,
      "&:hover": {
        backgroundColor: colors.accent.dark,
        boxShadow: colors.shadow.lg,
      },
    },

    outline: {
      backgroundColor: "transparent",
      color: colors.primary.main,
      padding: `${spacing.md} ${spacing["4xl"]}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: `2px solid ${colors.primary.main}`,
      "&:hover": {
        backgroundColor: colors.primary.main,
        color: colors.primary.foreground,
      },
    },
  },

  card: {
    base: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      boxShadow: colors.shadow.card,
      padding: spacing["5xl"],
      transition: "all 0.3s ease",
      border: `1px solid ${colors.border.light}`,
    },
    hover: {
      boxShadow: colors.shadow.hover,
      transform: "translateY(-4px)",
    },
  },

  input: {
    base: {
      backgroundColor: colors.background.primary,
      color: colors.neutral.textDarker,
      borderRadius: borderRadius.lg,
      border: `1.5px solid ${colors.border.light}`,
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.primary,
      transition: "all 0.3s ease",
      "&:focus": {
        borderColor: colors.primary.main,
        boxShadow: `0 0 0 3px ${colors.primary.main}20`,
        outline: "none",
      },
      "&::placeholder": {
        color: colors.neutral.darkGray,
      },
    },
  },

  section: {
    base: {
      padding: `${spacing["10xl"]} ${containerPadding.desktop}`,
    },
    compact: {
      padding: `${spacing["6xl"]} ${containerPadding.desktop}`,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ═══════════════════════════════════════════════════════════════════════════
// TRANSIÇÕES E ANIMAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

export const transitions = {
  fast: "0.15s ease",
  base: "0.3s ease",
  slow: "0.5s ease",
  slower: "0.8s ease",
};

export const animations = {
  fadeIn: "fadeIn 0.3s ease",
  slideUp: "slideUp 0.3s ease",
  slideDown: "slideDown 0.3s ease",
  slideLeft: "slideLeft 0.3s ease",
  slideRight: "slideRight 0.3s ease",
  scaleIn: "scaleIn 0.3s ease",
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════

export const theme = {
  colors,
  typography,
  spacing,
  containerPadding,
  containerMaxWidth,
  borderRadius,
  components,
  breakpoints,
  transitions,
  animations,
};

export default theme;
