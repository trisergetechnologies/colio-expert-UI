import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";

export default function EditProfileScreen() {
  const router = useRouter();

  // Editable fields
  const [name, setName] = useState("Shubham Sharma");
  const [phone, setPhone] = useState("9876543210");

  // Toggles
  const [calls, setCalls] = useState(true);
  const [chats, setChats] = useState(false);
  const [videos, setVideos] = useState(true);

  // Email update modal
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const handleNext = () => {
    if (step === 1 && email) setStep(2);
    else if (step === 2 && otp) setStep(3);
    else if (step === 3 && password && confirmPassword) {
      setShowModal(false);
      setStep(1);
      setEmail("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-start px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText className="text-lg ml-3 font-bold text-black">
            Edit Profile
          </ThemedText>

          {/* <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <ThemedText className="ml-1 font-medium text-black">Assist</ThemedText>
          </TouchableOpacity> */}
        </View>

        {/* Form Section */}
        <View className="px-4 mt-4 space-y-4">
          {/* Name Input */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            className="p-[1px] rounded-2xl mb-4"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl p-4">
              <ThemedText className="font-semibold text-black mb-2">
                Full Name
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                className="text-black text-base"
              />
            </View>
          </LinearGradient>

          {/* Phone Input */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            className="p-[1px] rounded-2xl"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl p-4">
              <ThemedText className="font-semibold text-black mb-2">
                Phone Number
              </ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                className="text-black text-base"
              />
            </View>
          </LinearGradient>

          {/* Toggles Section */}
          <ThemedText className="font-semibold text-black mt-2">
            Request Preferences
          </ThemedText>

          {[
            { label: "Accept only Call Requests", state: calls, set: setCalls },
            { label: "Accept only Chat Requests", state: chats, set: setChats },
            {
              label: "Accept only Video Requests",
              state: videos,
              set: setVideos,
            },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => item.set(!item.state)}
              activeOpacity={0.8}
              className="flex-row items-center justify-between bg-white/80 rounded-2xl px-4 py-3 mt-2 shadow-sm"
            >
              <ThemedText className="text-black font-medium">
                {item.label}
              </ThemedText>
              <LinearGradient
                colors={
                  item.state ? ["#ff9d76", "#ffd6a5"] : ["#e5e5e5", "#d1d5db"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className={`w-12 h-6 rounded-full flex-row items-center p-1 ${
                  item.state ? "justify-end" : "justify-start"
                }`}
                style={{ borderRadius: 16 }}
              >
                <View className="w-5 h-5 rounded-full bg-white shadow-md" />
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Change Email */}
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="flex-row items-center justify-center bg-[#ff9d76] py-3 rounded-2xl mt-5 shadow-md"
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <ThemedText className="ml-2 text-white font-semibold">
              Change Email ID
            </ThemedText>
          </TouchableOpacity>

          {/* Save Button */}
          <View className="mt-6">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className="rounded-2xl overflow-hidden shadow-md"
            >
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="bg-green-500 py-4 rounded-2xl active:opacity-80"
              >
                <ThemedText className="text-center text-white font-bold text-base">
                  Save Changes
                </ThemedText>
              </Animated.View>
            </TouchableOpacity>

            {saved && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                className="flex-row items-center justify-center mt-4 bg-white/90 rounded-full py-2 px-4 self-center shadow-md"
              >
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <ThemedText className="ml-2 text-green-600 font-semibold">
                  Changes Saved
                </ThemedText>
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Modal for Email Change Flow */}
      <Modal
        animationType="slide"
        visible={showModal}
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="bg-black/40 flex-1" />

          <Animated.View
            entering={FadeInDown.duration(400)}
            className="bg-white rounded-t-3xl p-6"
            style={{ minHeight: 350 }}
          >
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full mb-3" />
              <ThemedText className="text-lg font-bold text-black">
                Change Email ID
              </ThemedText>
            </View>

            {step === 1 && (
              <>
                <ThemedText className="mb-2 text-black/80">
                  Enter your new email address:
                </ThemedText>
                <TextInput
                  placeholder="example@mail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black mb-5"
                />
              </>
            )}

            {step === 2 && (
              <>
                <ThemedText className="mb-2 text-black/80">
                  Enter the OTP sent to your new email:
                </ThemedText>
                <TextInput
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black mb-5"
                />
              </>
            )}

            {step === 3 && (
              <>
                <ThemedText className="mb-2 text-black/80">
                  Enter new password:
                </ThemedText>
                <TextInput
                  placeholder="New Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black mb-3"
                />
                <TextInput
                  placeholder="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-black mb-5"
                />
              </>
            )}

            <TouchableOpacity
              onPress={handleNext}
              className="bg-[#ff9d76] py-3 rounded-2xl mt-2 shadow-md"
            >
              <ThemedText className="text-center text-white font-semibold">
                {step === 1
                  ? "Send OTP"
                  : step === 2
                    ? "Verify OTP"
                    : "Update Email & Password"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="mt-4"
            >
              <ThemedText className="text-center text-gray-500">
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}
