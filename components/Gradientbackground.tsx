import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ViewStyle, StyleSheet } from "react-native";

type GradientBackgroundProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <LinearGradient
      // Fixed theme gradient
      colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 2, y: 1 }}
            end={{ x: 0, y: 0 }}

      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});