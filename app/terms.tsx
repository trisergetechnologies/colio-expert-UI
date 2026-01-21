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
  <View className="mb-6">
    <View className="flex-row items-center mb-2">
      <View className="w-8 h-8 rounded-full bg-[#ff9d76] items-center justify-center mr-2">
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <ThemedText className="text-base font-bold text-black">
        {title}
      </ThemedText>
    </View>
    <ThemedText className="text-black/70 leading-6">{children}</ThemedText>
  </View>
);

export default function TermsScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-14 pb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-lg font-bold ml-3 text-black">
            Terms & Conditions
          </ThemedText>
        </View>

        {/* Intro */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          className="mx-4 mt-4 bg-white/90 rounded-2xl p-5 shadow-sm"
        >
          <ThemedText className="text-lg font-bold text-black mb-2">
            Welcome to Colio
          </ThemedText>
          <ThemedText className="text-black/70 leading-6 mb-6">
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

          <ThemedText className="text-black/50 text-xs mt-6 text-center">
            Last updated: January 2026
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}
