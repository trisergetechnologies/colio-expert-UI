import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const Section = ({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: 24 }}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#ff9d76",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
        }}
      >
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <ThemedText style={{ fontSize: 16, fontWeight: "700", color: "#000" }}>
        {title}
      </ThemedText>
    </View>
    <ThemedText style={{ color: "rgba(0,0,0,0.7)", lineHeight: 22 }}>
      {children}
    </ThemedText>
  </View>
);

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginLeft: 12,
              color: "#000",
            }}
          >
            Privacy Policy
          </ThemedText>
        </View>

        {/* Content Card */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Your Privacy Matters
          </ThemedText>

          <ThemedText
            style={{
              color: "rgba(0,0,0,0.7)",
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            Colio is committed to protecting your personal information. This
            Privacy Policy explains how your data is collected, used, and
            safeguarded when you operate as a host on the platform.
          </ThemedText>

          <Section
            icon="document-text-outline"
            title="Information We Collect"
          >
            We may collect personal details such as your name, profile
            information, contact details, session activity, ratings, and usage
            metrics required to operate the platform efficiently.
          </Section>

          <Section icon="analytics-outline" title="How We Use Your Data">
            Your information is used to manage sessions, process payouts,
            improve service quality, enhance safety, and provide personalized
            platform insights. We do not sell your personal data.
          </Section>

          <Section
            icon="lock-closed-outline"
            title="Data Protection & Security"
          >
            We implement industry-standard technical and organizational measures
            to protect your data against unauthorized access, loss, or misuse.
          </Section>

          <Section icon="people-outline" title="Data Sharing">
            Your information is shared only with trusted service providers or
            when legally required. We never disclose personal data for marketing
            purposes without consent.
          </Section>

          <Section icon="time-outline" title="Data Retention">
            We retain your data only for as long as necessary to fulfill
            platform obligations, legal requirements, and dispute resolution.
          </Section>

          <Section icon="settings-outline" title="Your Rights & Control">
            You may request access, correction, or deletion of your personal
            data, subject to applicable laws and platform policies.
          </Section>

          <ThemedText
            style={{
              color: "rgba(0,0,0,0.5)",
              fontSize: 12,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Last updated: January 2026
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}
