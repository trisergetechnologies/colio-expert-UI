"use client";

import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";

export default function PrivateLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuth();

  // 🚫 Redirect authenticated users to /home (or tabs)
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthLoading, isAuthenticated]);

  // 🔄 Show loader while checking auth
  if (isAuthLoading) {
    return (
      <LinearGradient
        colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
        start={{ x: 1, y: 3 }}
        end={{ x: 0, y: 0 }}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ff9d76" />
      </LinearGradient>
    );
  }

  // ✅ Allow rendering only if user is NOT logged in
  if (isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5dc",
        },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
        contentStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5dc",
        },
      }}
    >
      {/* Screens inside (private) should only be visible when NOT logged in */}
      <Stack.Screen
        name="auth"
        options={{
          title: "Auth",
        }}
      />
    </Stack>
  );
}
