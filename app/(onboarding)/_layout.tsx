"use client";

import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, BackHandler } from "react-native";

export default function OnboardingLayout() {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, user } = useAuth();

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user) return;
    const st = user.consultantProfile?.applicationStatus ?? "approved";
    if (st === "approved") {
      router.replace("/(tabs)/home");
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  if (isAuthLoading) {
    return (
      <LinearGradient
        colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#ff9d76" />
      </LinearGradient>
    );
  }

  if (!isAuthenticated || !user) {
    router.replace("/(auth)/auth");
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fffaf3" },
      }}
    />
  );
}
