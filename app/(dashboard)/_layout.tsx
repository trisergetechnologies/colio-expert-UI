// app/(private)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function dashboardLayout() {

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
     <SafeAreaProvider>
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="settlement"
        options={{
          title: "Settlements",
           headerShown: false,
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: "Support",
           headerShown: false,
        }}
      />
      <Stack.Screen
        name="AboutUs"
        options={{
          title: "AboutUs",
          headerShown: false,
        }}
      />
    </Stack>
    </SafeAreaProvider>
  );
}
