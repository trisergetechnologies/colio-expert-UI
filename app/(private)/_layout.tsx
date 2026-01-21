// app/(private)/_layout.tsx
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
  
    // ✅ Redirect if not logged in
    useEffect(() => {
      if (!isAuthLoading) {
        if (!isAuthenticated || !user) {
          router.replace("/(auth)/auth");
        }
      }
    }, [isAuthLoading, isAuthenticated, user]);
  
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
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5dc", // dark=black, light=beige
        },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
        contentStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5dc", // match screen bg
        },
      }}
    >

      <Stack.Screen
        name="call"
        options={{
          title: "Call",
        }}
      />

      <Stack.Screen
        name="incoming-call"
        options={{
          title: "Incoming Call",
        }}
      />
    </Stack>
  );
}
