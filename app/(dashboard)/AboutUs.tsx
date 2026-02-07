import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";

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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 12,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText
            style={{
              marginLeft: 12,
              fontSize: 18,
              fontWeight: "700",
              color: "#000",
            }}
          >
            About Colio
          </ThemedText>
        </View>

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingHorizontal: 16, marginTop: 16, alignItems: "center" }}
        >
          <ThemedText
            style={{
              fontFamily: "Pacifico_400Regular",
              fontSize: 60,
              color: "white",
              marginBottom: 40,
              paddingTop: 40,
            }}
          >
            Colio
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#000",
              textAlign: "center",
            }}
          >
            Talk it out. Chill it out. Colio it out
          </ThemedText>

          <ThemedText
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "500",
              color: "rgba(0,0,0,0.7)",
              marginTop: 8,
            }}
          >
            Connecting people with authentic guidance, clarity, and positivity.
          </ThemedText>
        </Animated.View>

        {/* Platform Overview */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={{ paddingHorizontal: 16, marginTop: 24 }}
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 1 }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <ThemedText
                style={{ color: "#000", fontWeight: "600", fontSize: 18, marginBottom: 8 }}
              >
                What is Colio?
              </ThemedText>

              <ThemedText style={{ color: "rgba(0,0,0,0.7)", lineHeight: 24 }}>
                Colio isn’t just another chat app — it’s your space to be real. A place where you can talk, vent, laugh, ask, share, or just vibe with real people who actually get it. Whether you’re bored, curious, stressed, or simply craving a good conversation, Colio connects you instantly through call, chat, or video — no pressure, no judgment, just genuine connection.
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={{ paddingHorizontal: 16, marginTop: 24 }}
        >
          <ThemedText
            style={{ fontSize: 20, fontWeight: "700", color: "#000", marginBottom: 12 }}
          >
            Key Features
          </ThemedText>

          {features.map((feature) => {
            const isOpen = expanded === feature.id;

            return (
              <Animated.View key={feature.id} layout={Layout.springify()} style={{ marginBottom: 12 }}>
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
                    style={{ borderRadius: 16, padding: 1 }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.85)",
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: "#ff9d76",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <Ionicons name={feature.icon as any} size={22} color="#fff" />
                          </View>

                          <ThemedText style={{ color: "#000", fontWeight: "600", fontSize: 16 }}>
                            {feature.title}
                          </ThemedText>
                        </View>

                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#555"
                        />
                      </View>

                      <ThemedText
                        style={{
                          color: "rgba(0,0,0,0.7)",
                          fontSize: 14,
                          marginTop: 8,
                        }}
                      >
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
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={{ paddingHorizontal: 16, marginTop: 24 }}
        >
          <ThemedText
            style={{ fontSize: 20, fontWeight: "700", color: "#000", marginBottom: 12 }}
          >
            Why Colio Leads the Way
          </ThemedText>

          {highlights.map((point, index) => (
            <LinearGradient
              key={index}
              colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 1, marginBottom: 12 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.8)",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#22c55e"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={{ color: "rgba(0,0,0,0.8)" }}>
                  {point}
                </ThemedText>
              </View>
            </LinearGradient>
          ))}
        </Animated.View>

        {/* Mission */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 32 }}
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 1 }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 8 }}
              >
                Our Vision
              </ThemedText>

              <ThemedText
                style={{
                  color: "rgba(0,0,0,0.7)",
                  textAlign: "center",
                  lineHeight: 24,
                }}
              >
                Our vision is simple: to make talking feel natural, authentic, and meaningful. We believe connection should feel effortless — not filtered, not forced. Colio is here to remind everyone that real people still exist behind the screens. Real talks. No filters. Just vibes.
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View style={{ alignItems: "center", paddingBottom: 24 }}>
          <ThemedText style={{ color: "#9ca3af", fontSize: 14 }}>
            © 2025 Colio • v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
