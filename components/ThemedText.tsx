import { Text, TextProps } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export function ThemedText({ style, ...props }: TextProps) {
  const { textColor } = useThemeColors();

  return (
    <Text
      {...props}
      style={[
        { color: textColor }, // system-based color
        style, // allow custom overrides
      ]}
    />
  );
}
