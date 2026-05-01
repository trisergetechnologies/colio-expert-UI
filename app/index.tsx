import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import firebase from '@react-native-firebase/app';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, TouchableOpacity, View } from "react-native";
import "../global.css";

const slogans = [
  "Connect with Experts",
  "Grow with Mentors",
  "Earn & Learn Together",
  "Build Your Network",
  "Explore Without Limits",
];

export default function IndexScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { isAuthenticated, isAuthLoading, user } = useAuth();

  const applicationStatus = user?.consultantProfile?.applicationStatus;

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user) return;

    const checkAndRedirect = async () => {
      await global.__pendingCallPromise;

      if (global.__pendingCallData && global.__pendingCallData.actionId !== 'decline') {
        console.log('[Index] 📞 Opened from call notification — skipping home redirect');
        return;
      }

      if (applicationStatus === "pending_approval") {
        router.replace("/(onboarding)/pending");
        return;
      }
      if (applicationStatus === "rejected") {
        router.replace("/(onboarding)/rejected");
        return;
      }
      if (applicationStatus === "pending_profile") {
        router.replace("/(onboarding)/personal-info");
        return;
      }
      if (applicationStatus === "approved") {
        router.replace("/(tabs)/home");
        return;
      }
      router.replace("/(onboarding)/personal-info");
    };

    checkAndRedirect();
  }, [isAuthLoading, isAuthenticated, !!user, applicationStatus]);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) return;
    console.log('=== FIREBASE DEBUG (EXPERT APP) ===');
    console.log('Firebase apps length:', firebase.apps.length);
    if (firebase.apps.length > 0) {
      console.log('✅ Firebase app exists');
      console.log('App name:', firebase.app().name);
      console.log('Project ID:', firebase.app().options.projectId);
    } else {
      console.log('❌ No Firebase app initialized');
    }
    console.log('====================================');
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      setCurrentIndex((prev) => (prev + 1) % slogans.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim, isAuthLoading, isAuthenticated]);

  if (isAuthLoading || isAuthenticated) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 48,
        }}
      >
        {/* Brand Name */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text
            style={{
              fontFamily: "Pacifico_400Regular",
              fontSize: 50,
              color: "black",
              letterSpacing: 1,
            }}
          >
            Colio
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "black",
              paddingHorizontal: 24,
              textAlign: "center",
            }}
          >
            The Future of Anonymous Connections & Vibrant Conversations
          </Text>
        </View>

        {/* Rotating Slogan Banner */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 10,
          }}
        >
          <Animated.Text
            style={{
              opacity: fadeAnim,
              fontFamily: "Pacifico_400Regular",
              fontSize: 60,
              fontWeight: "600",
              color: "#db2777",
              textAlign: "center",
              paddingHorizontal: 10,
            }}
          >
            {slogans[currentIndex]}
          </Animated.Text>
        </View>

        {/* Get Started Button */}
        <View
          style={{
            width: "100%",
            alignItems: "center",
            paddingBottom: 40,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(auth)/auth")}
            activeOpacity={0.9}
            style={{
              width: "100%",
              borderRadius: 16,
              overflow: "hidden",
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={["#db2777", "#db2777"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 18,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                  fontFamily: "Poppins_600SemiBold",
                }}
              >
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 12,
              color: "black",
              marginTop: 16,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            By tapping you agree to our{" "}
            <Text
              onPress={() => router.push("/terms")}
              style={{ color: "#16a34a", textDecorationLine: "underline" }}
            >
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text
              onPress={() => router.push("/privacy")}
              style={{ color: "#16a34a" }}
            >
              Privacy Policy
            </Text>
            .{"\n"}
            All your details are protected, safe, and secure.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}