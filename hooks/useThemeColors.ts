import { useColorScheme } from "react-native";

export function useThemeColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    textColor:"#000000",

    // Gradient colors for light mode
    bgGradient: !isDark
      ? {
          colors: ["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"],
          start: { x: 1, y: 1 },
          end: { x: 1, y: 1 },
        }
      : null,
  };
}
