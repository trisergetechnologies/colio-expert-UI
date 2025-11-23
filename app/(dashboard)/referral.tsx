// app/(private)/referral.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import GradientBackground from "@/components/Gradientbackground";
import { useRouter } from "expo-router";

export default function ReferralScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const referralCode = "PR98276BQN";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-bold text-black">Referral</Text>

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <Text className="ml-1 font-medium text-black">Assist</Text>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <Image
          source={require("@/assets/images/banner.jpg")}
          className="w-full h-48 rounded-b-3xl"
          resizeMode="cover"
        />

        {/* Main Content */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="px-5 mt-6"
        >
          <Text className="text-2xl font-extrabold text-center text-black">
            Invite & Earn Rewards 🎉
          </Text>
          <Text className="text-center text-black/70 mt-2">
            Share your referral code with friends and get exclusive rewards when they join Colio.
          </Text>
        </Animated.View>

        {/* Referral Code */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="px-5 mt-6"
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl mb-4 p-[1px] shadow-sm"
            style={{borderRadius:16}}
          >
            <View className="flex-row justify-between items-center bg-white/70 rounded-2xl px-4 py-3">
              <Text className="text-lg font-semibold text-black">
                {referralCode}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                className="flex-row items-center bg-black px-3 py-2 rounded-lg"
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text className="text-white ml-1 font-semibold">
                  {copied ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Share Buttons */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          className="px-5 mt-7 space-y-3"
        >
          <TouchableOpacity className="flex-row items-center justify-center py-3 rounded-2xl shadow-md bg-green-500">
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text className="text-white ml-2 font-semibold text-base">
              Share via WhatsApp
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity className="flex-row items-center justify-center mt-3 py-3 rounded-2xl shadow-md  bg-blue-600">
            <Ionicons name="person-add-outline" size={22} color="#fff" />
            <Text className="text-white ml-2 font-semibold text-base">
              Invite Friends
            </Text>
          </TouchableOpacity> */}
        </Animated.View>

        {/* Referral Stats */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          className="flex-row justify-between px-5 mt-8"
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 mr-2 rounded-2xl p-[1px] shadow-sm"
            style={{borderRadius:16}}
          >
            <View className="bg-white/70 rounded-2xl p-4">
              <Text className="text-black/60 text-sm">Referral Rewards</Text>
              <Text className="text-2xl font-bold text-black mt-1">₹3,250</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 ml-2 rounded-2xl p-[1px] shadow-sm"
            style={{borderRadius:16}}
          >
            <View className="bg-white/70 rounded-2xl p-4">
              <Text className="text-black/60 text-sm">Pending Referrals</Text>
              <Text className="text-2xl font-bold text-black mt-1">1 Invite</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Footer Links */}
        <View className="flex-row justify-between px-6 mt-8 mb-3">
          <TouchableOpacity>
            <Text className="text-[#ff9d76] font-semibold">
              Terms & Conditions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-[#ff9d76] font-semibold">Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
