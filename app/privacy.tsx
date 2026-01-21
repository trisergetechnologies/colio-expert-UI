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

export default function PrivacyPolicyScreen() {
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
            Privacy Policy
          </ThemedText>
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          className="mx-4 mt-4 bg-white/90 rounded-2xl p-5 shadow-sm"
        >
          <ThemedText className="text-lg font-bold text-black mb-2">
            Your Privacy Matters
          </ThemedText>
          <ThemedText className="text-black/70 leading-6 mb-6">
            Colio is committed to protecting your personal information. This
            Privacy Policy explains how your data is collected, used, and
            safeguarded when you operate as a host on the platform.
          </ThemedText>

          <Section icon="document-text-outline" title="Information We Collect">
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

          <ThemedText className="text-black/50 text-xs mt-6 text-center">
            Last updated: January 2026
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}
