// app/(private)/support.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";

export default function SupportScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [sent, setSent] = useState(false);

  const templates = [
    { id: "billing", label: "Billing Issue", text: "I have a billing issue regarding my last payout..." },
    { id: "tech", label: "Tech Problem", text: "The app is crashing when I accept a request..." },
    { id: "account", label: "Account Help", text: "I need help updating my profile details..." },
  ];

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.assets) {
        setFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.log("File picking cancelled:", error);
    }
  };

  const handleEmail = async () => {
    const mail = "support@colio.com";
    const subject = encodeURIComponent("Support request");
    const body = encodeURIComponent(query || "Hi, I need help with...");
    try {
      const url = `mailto:${mail}?subject=${subject}&body=${body}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open mail client");
    }
  };

  const handleCall = async () => {
    const phone = "+919876543210";
    const url = Platform.OS === "android" ? `tel:${phone}` : `telprompt:${phone}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open dialer");
    }
  };

  const handleTemplate = (txt: string) => {
    setQuery((prev) => (prev ? prev + "\n\n" + txt : txt));
  };

  const handleSend = () => {
    if (!query.trim()) {
      Alert.alert("Please write a message before sending.");
      return;
    }

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setQuery("");
      setFiles([]);
    }, 1200);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText className="text-lg font-bold text-black">
            Quick Assistance
          </ThemedText>

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <ThemedText className="ml-1 font-medium text-black">Help</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Quick Assist Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="px-4 mt-6"
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-[1px] shadow-sm"
            style={{borderRadius:16}}
          >
            <View className="bg-white/80 rounded-3xl p-5">
              <View className="flex-row items-start">
                <View className="w-14 h-14 rounded-xl bg-green-500 items-center justify-center shadow-sm">
                  <Ionicons name="help-circle" size={28} color="#fff" />
                </View>

                <View className="flex-1 pl-3">
                  <ThemedText className="text-lg font-bold text-black">
                    Quick Assist
                  </ThemedText>
                  <ThemedText className="text-sm text-black/70 mt-1">
                    Contact us quickly or use templates to save time.
                  </ThemedText>

                  <View className="flex-row mt-4">
                    <TouchableOpacity
                      onPress={handleEmail}
                      className="flex-row items-center justify-center px-4 py-2 rounded-full bg-[#ffd6a5] mr-3"
                    >
                      <Ionicons name="mail" size={16} color="#000" />
                      <ThemedText className="ml-2 text-sm font-semibold text-black">
                        Email
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCall}
                      className="flex-row items-center justify-center px-4 py-2 rounded-full bg-[#ffd6a5]"
                    >
                      <Ionicons name="call" size={16} color="#000" />
                      <ThemedText className="ml-2 text-sm font-semibold text-black">
                        Call
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <Ionicons name="time-outline" size={14} color="#000" />
                    <ThemedText className="ml-2 text-xs text-black/60">
                      Support hours: 9 AM — 9 PM
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Templates */}
          <View className="flex-row flex-wrap mt-4">
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTemplate(t.text)}
                className="px-4 py-2 mr-2 mb-2 rounded-full bg-[#ff9d76]/80"
              >
                <ThemedText className="text-sm font-medium text-black">
                  {t.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Query Input */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="px-4 mt-6"
        >
          <ThemedText className="mb-2 px-4 font-semibold text-black">
            Write Your Query
          </ThemedText>
          <View className="bg-white/70 rounded-2xl shadow-sm p-3">
            <ScrollView style={{ maxHeight: 140 }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Describe your issue..."
                multiline
                style={{
                  fontSize: 15,
                  textAlignVertical: "top",
                  color: "#111827",
                }}
              />
            </ScrollView>
          </View>
        </Animated.View>

        {/* Attachments */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          className="px-4 mt-6"
        >
          <ThemedText className="mb-2 px-4 font-semibold text-black">
            Attachments
          </ThemedText>

          <TouchableOpacity
            onPress={handleFilePick}
            className="flex-row items-center justify-center border border-dashed border-[#ff9d76] rounded-2xl py-4 bg-white/60"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#ff9d76" />
            <ThemedText className="ml-2 text-[#ff9d76] font-semibold">
              Attach File
            </ThemedText>
          </TouchableOpacity>

          <FlatList
            data={files}
            keyExtractor={(f, i) => `${f.name}-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12 }}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInUp.delay(50 + index * 80)}
                className="mr-3 items-center"
              >
                <View className="w-16 h-16 rounded-xl bg-[#fffaf3] border border-[#ffb085]/50 items-center justify-center">
                  <Ionicons name="document" size={26} color="#ff9d76" />
                </View>
                <ThemedText
                  className="text-xs w-16 text-center mt-2 text-black"
                  numberOfLines={1}
                >
                  {item.name}
                </ThemedText>
                <TouchableOpacity onPress={() => removeFile(index)} className="mt-1">
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* Send Button */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          className="px-4 mt-8"
        >
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.9}
            className="flex-row items-center justify-center py-4 rounded-2xl bg-green-500 shadow-md"
          >
            <Ionicons name="send" size={18} color="#fff" />
            <ThemedText className="ml-2 text-white font-semibold">
              Send Message
            </ThemedText>
          </TouchableOpacity>

          {sent && (
            <Animated.View
              entering={FadeInUp.duration(400)}
              className="mt-4 items-center"
            >
              <LinearGradient
                colors={["#ffd6a5", "#ff9d76", "#ffeac7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{borderRadius:16}}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <ThemedText className="ml-2 text-white font-semibold">
                  Sent
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({});
