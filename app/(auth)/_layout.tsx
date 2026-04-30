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
  const { isAuthenticated, isAuthLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      const st = user.consultantProfile?.applicationStatus ?? "approved";
      if (st === "approved") {
        router.replace("/(tabs)/home");
      } else if (st === "pending_approval") {
        router.replace("/(onboarding)/pending");
      } else if (st === "rejected") {
        router.replace("/(onboarding)/rejected");
      } else {
        router.replace("/(onboarding)/personal-info");
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

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

  if (isAuthenticated && user) return null;

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
      <Stack.Screen name="signup" options={{ title: "Sign up" }} />
    </Stack>
  );
}
