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

export default function TermsScreen() {
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
            Terms & Conditions
          </ThemedText>
        </View>

        {/* Intro Card */}
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
            Welcome to Colio
          </ThemedText>

          <ThemedText
            style={{
              color: "rgba(0,0,0,0.7)",
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            These Terms & Conditions define your rights and responsibilities as
            a host on the Colio platform. By accessing or using Colio, you
            acknowledge that you have read, understood, and agreed to these
            terms.
          </ThemedText>

          <Section icon="people-outline" title="Host Responsibilities">
            As a host, you agree to provide respectful, ethical, and
            professional interactions. You must not engage in harassment,
            misleading guidance, or any form of inappropriate conduct during
            calls, chats, or video sessions.
          </Section>

          <Section icon="time-outline" title="Availability & Session Conduct">
            You are responsible for managing your availability accurately.
            Repeated missed sessions, abrupt disconnections, or misuse of the
            platform may result in temporary suspension or permanent account
            termination.
          </Section>

          <Section icon="wallet-outline" title="Sessions & Payments">
            Earnings are calculated based on completed sessions and applicable
            rates at the time of service. Colio reserves the right to adjust
            payout structures, fees, or settlement cycles with prior notice.
          </Section>

          <Section
            icon="shield-checkmark-outline"
            title="Compliance & Integrity"
          >
            You must comply with all applicable laws and platform policies.
            Attempts to bypass platform safeguards, manipulate sessions, or
            solicit users outside Colio are strictly prohibited.
          </Section>

          <Section icon="lock-closed-outline" title="Account Security">
            You are responsible for maintaining the confidentiality of your
            login credentials. Any activity performed using your account will be
            considered your responsibility.
          </Section>

          <Section icon="alert-circle-outline" title="Termination">
            Colio reserves the right to suspend or terminate accounts that
            violate platform rules, engage in fraudulent activity, or harm the
            trust and safety of users.
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
