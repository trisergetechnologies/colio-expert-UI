import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";

export default function AboutUsScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const features = [
    {
      id: "1",
      icon: "shield-checkmark-outline",
      title: "Verified Professionals",
      short: "Every advisor on Colio is verified and rated.",
      detail:
        "Our experts undergo a rigorous verification process, ensuring authentic, professional guidance — no fake profiles, no unverified advisors.",
    },
    {
      id: "2",
      icon: "flash-outline",
      title: "Instant Calls, Chats & Video",
      short: "Connect instantly in your preferred mode.",
      detail:
        "Using Agora’s real-time technology, Colio ensures high-quality, low-latency communication with astrologers and consultants 24×7.",
    },
    {
      id: "3",
      icon: "chatbubbles-outline",
      title: "Smart Recommendations",
      short: "We match you to the best experts for your needs.",
      detail:
        "Our algorithm analyzes expertise, ratings, and user preferences to connect clients with the most suitable professional every time.",
    },
    {
      id: "4",
      icon: "lock-closed-outline",
      title: "Secure Payments & Privacy",
      short: "Your data & money are protected.",
      detail:
        "All transactions are fully encrypted, and chats are safeguarded with enterprise-grade privacy protection — only between you and your expert.",
    },
  ];

  const highlights = [
    "Faster connection speed than competitors",
    "Seamless experience across call, chat, and video",
    "Intuitive and minimal UI for clients & experts",
    "Dedicated support and continuous updates",
  ];

  return (
    <GradientBackground>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 70 }}>
        {/* Header */}
        <View className="flex-row items-center justify-start px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText className="text-lg font-bold ml-3 text-black">
            About Colio
          </ThemedText>

          {/* <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#ff9d76" />
            <ThemedText className="ml-1 font-medium text-black">Assist</ThemedText>
          </TouchableOpacity> */}
        </View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="px-4 mt-4 items-center">
          <ThemedText
                      style={{
                        fontFamily: "Pacifico_400Regular",
                      }}
                      className="text-6xl text-white mb-10 pt-10"
                    >
                      Colio
                    </ThemedText>
          
          <ThemedText className="text-2xl font-bold text-black text-center">
            Talk it out. Chill it out. Colio it out
          </ThemedText>
          <ThemedText className="text-center text-md font-medium text-black/70 mt-2">
            Connecting people with authentic guidance, clarity, and positivity.
          </ThemedText>
        </Animated.View>

        {/* Platform Overview */}
        <Animated.View entering={FadeInUp.delay(200).springify()} className="px-4 mt-6">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/85 rounded-2xl p-4">
              <ThemedText className="text-black font-semibold text-lg mb-2">
                What is Colio?
              </ThemedText>
              <ThemedText className="text-black/70 leading-6">
                Colio isn’t just another chat app — it’s your space to be real. A place where you can talk, vent, laugh, ask, share, or just vibe with real people who actually get it. Whether you’re bored, curious, stressed, or simply craving a good conversation, Colio connects you instantly through call, chat, or video — no pressure, no judgment, just genuine connection.
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Features Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="px-4 mt-6">
          <ThemedText className="text-xl font-bold text-black mb-3">
            Key Features
          </ThemedText>

          {features.map((feature) => {
            const isOpen = expanded === feature.id;
            return (
              <Animated.View
                key={feature.id}
                layout={Layout.springify()}
                className="mb-3"
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setExpanded(isOpen ? null : feature.id)}
                >
                  <LinearGradient
                    colors={
                      isOpen
                        ? ["#ffd6a5", "#ff9d76", "#ffeac7"]
                        : ["#fffaf3", "#fffaf3"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl p-[1px]"
                    style={{ borderRadius: 16 }}
                  >
                    <View className="bg-white/85 rounded-2xl p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-full bg-[#ff9d76] items-center justify-center mr-3">
                            <Ionicons name={feature.icon as any} size={22} color="#fff" />
                          </View>
                          <ThemedText className="text-black font-semibold text-base">
                            {feature.title}
                          </ThemedText>
                        </View>
                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#555"
                        />
                      </View>

                      <ThemedText className="text-black/70 text-sm mt-2">
                        {isOpen ? feature.detail : feature.short}
                      </ThemedText>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Why We're Best */}
        <Animated.View entering={FadeInUp.delay(400).springify()} className="px-4 mt-6">
          <ThemedText className="text-xl font-bold text-black mb-3">
            Why Colio Leads the Way
          </ThemedText>
          {highlights.map((point, index) => (
            <LinearGradient
              key={index}
              colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-[1px] mb-3"
              style={{ borderRadius: 16 }}
            >
              <View className="bg-white/80 rounded-2xl p-4 flex-row items-start">
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" className="mr-2" />
                <ThemedText className="text-black/80">{point}</ThemedText>
              </View>
            </LinearGradient>
          ))}
        </Animated.View>

        {/* Mission */}
        <Animated.View entering={FadeInDown.delay(500).springify()} className="px-4 mt-8 mb-8">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px]"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/85 rounded-2xl p-5 items-center">
              <ThemedText className="text-lg font-bold text-black mb-2">
                Our Vision
              </ThemedText>
              <ThemedText className="text-black/70 text-center leading-6">
                Our vision is simple: to make talking feel natural, authentic, and meaningful. We believe connection should feel effortless — not filtered, not forced. Colio is here to remind everyone that real people still exist behind the screens. Real talks. No filters. Just vibes.
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View className="items-center pb-6">
          <ThemedText className="text-gray-400 text-sm">
            © 2025 Colio • v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
