// Utility functions for using CSS variables in JavaScript contexts

export const getCssVar = (variableName: string): string => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
};

export const bgColors = {
  background: "var(--color-background)",
  card: "var(--color-card)",
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  buttonSecondary: "var(--color-button-secondary)",
};

export const textColors = {
  default: "var(--color-text)",
  accent: "var(--color-text-accent)",
  background: "var(--color-background)",
};

export const shadows = {
  primaryGlow: "0px 0px 10px rgba(0, 173, 181, 0.6)",
  secondaryGlow: "0px 0px 10px rgba(255, 107, 107, 0.6)",
  successGlow: "0px 0px 10px rgba(34, 197, 94, 0.6)",
};
