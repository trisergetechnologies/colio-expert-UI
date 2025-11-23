// app/index.tsx
import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

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

   const { isAuthenticated, isAuthLoading } = useAuth();

   // 🚫 Redirect authenticated users to /home (or tabs)
   useEffect(() => {
     if (!isAuthLoading && isAuthenticated) {
       router.replace("/(tabs)/home");
     }
   }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setCurrentIndex((prev) => (prev + 1) % slogans.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GradientBackground>
      <View className="flex-1 justify-between px-6 py-12">
        {/* Brand Name */}
        <View className="items-center mt-10">
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
        

          <Text className="text-lg font-semibold text-black px-6 text-center">
            The Future of Anonymous Connections & Vibrant Conversations
          </Text>
        </View>

        {/* Rotating Slogan Banner */}
        <View className="items-center justify-center flex-1">
          <Animated.Text
            style={{
              opacity: fadeAnim,
              fontFamily: "Pacifico_400Regular",
              fontSize: 60,
              fontWeight: 600,
              color: "#db2777", // pink-400
              textAlign: "center",
              paddingHorizontal: 10,
            }}
          >
            {slogans[currentIndex]}
          </Animated.Text>
        </View>

        {/* Get Started Button */}
        <View className="items-center pb-10">
          <TouchableOpacity
            onPress={() => router.push("/(auth)/auth")}
            activeOpacity={0.9}
            className="w-full rounded-2xl shadow-lg overflow-hidden"
          >
            <LinearGradient
              colors={["#db2777", "#db2777"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 rounded-2xl"
            >
              <Text
                className="text-center text-white text-lg font-extrabold tracking-wide"
                style={{ fontFamily: "Poppins_600SemiBold" }}
              >
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text className="text-xs text-black mt-4 text-center leading-5">
            By tapping you agree to our{" "}
            <Text className="text-green-600 underline">Terms of Use</Text> and{" "}
            <Text className="text-green-600">Privacy Policy</Text>.{"\n"}
            All your details are protected, safe, and secure.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}
