import { useColorScheme } from "react-native";

const theme = {
  light: {
    background: "#F9FAFB",
    cardBackground: "#FFFFFF",
    textPrimary: "#1F2937",
    textSecondary: "#6B7280",
    accent: "#FF8C00",
    navbarBackground: "rgba(255, 255, 255, 0.95)",
    border: "#E5E7EB",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F97316",
  },
  dark: {
    background: "#1F2937",
    cardBackground: "#374151",
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    accent: "#FF8C00",
    navbarBackground: "rgba(31, 41, 55, 0.95)",
    border: "#4B5563",
    success: "#16A34A",
    error: "#DC2626",
    warning: "#EA580C",
  },
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  return theme[colorScheme || "light"];
};