"use client";

import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/(auth)/auth");
        return;
      }
      const st = user.consultantProfile?.applicationStatus ?? "approved";
      if (st !== "approved") {
        if (st === "pending_approval") router.replace("/(onboarding)/pending");
        else if (st === "rejected") router.replace("/(onboarding)/rejected");
        else router.replace("/(onboarding)/personal-info");
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  // ✅ Loading state
  if (isAuthLoading) {
    return (
      <LinearGradient
        colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
        start={{ x: 1, y: 3 }}
        end={{ x: 0, y: 0 }}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#ff9d76" />
      </LinearGradient>
    );
  }

  // ✅ Prevent rendering Tabs before auth is checked
  if (!isAuthenticated || !user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#db2777",
        tabBarInactiveTintColor: "#000000",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#480048",
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: "transparent",
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 1, y: 3 }}
            end={{ x: 0, y: 0 }}
            style={{ flex: 1 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sessions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
