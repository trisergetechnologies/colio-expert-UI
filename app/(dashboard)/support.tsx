import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function SupportScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [sent, setSent] = useState(false);

  const templates = [
    {
      id: "billing",
      label: "Billing Issue",
      text: "I have a billing issue regarding my last payout...",
    },
    {
      id: "tech",
      label: "Tech Problem",
      text: "The app is crashing when I accept a request...",
    },
    {
      id: "account",
      label: "Account Help",
      text: "I need help updating my profile details...",
    },
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
    const mail = "hr@colio.com";
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
    const phone = "8368354151";
    const url =
      Platform.OS === "android" ? `tel:${phone}` : `telprompt:${phone}`;
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 12,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText style={{ fontSize: 18, fontWeight: "700", color: "#000" }}>
            Quick Assistance
          </ThemedText>

          <View style={{ width: 24 }} />
        </View>

        {/* Quick Assist Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingHorizontal: 16, marginTop: 24 }}
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6 }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "#22c55e",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <Ionicons name="help-circle" size={28} color="#fff" />
                </View>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: "700", color: "#000" }}>
                    Quick Assist
                  </ThemedText>

                  <ThemedText style={{ fontSize: 14, color: "rgba(0,0,0,0.7)", marginTop: 4 }}>
                    Contact us quickly or use templates to save time.
                  </ThemedText>

                  <View style={{ flexDirection: "row", marginTop: 16 }}>
                    <TouchableOpacity
                      onPress={handleEmail}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: "#ffd6a5",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="mail" size={16} color="#000" />
                      <ThemedText style={{ marginLeft: 8, fontSize: 14, fontWeight: "600", color: "#000" }}>
                        Email
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCall}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: "#ffd6a5",
                      }}
                    >
                      <Ionicons name="call" size={16} color="#000" />
                      <ThemedText style={{ marginLeft: 8, fontSize: 14, fontWeight: "600", color: "#000" }}>
                        Call
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                    <Ionicons name="time-outline" size={14} color="#000" />
                    <ThemedText style={{ marginLeft: 8, fontSize: 12, color: "rgba(0,0,0,0.6)" }}>
                      Support hours: 9 AM — 9 PM
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Templates */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTemplate(t.text)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 8,
                  marginBottom: 8,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,157,118,0.8)",
                }}
              >
                <ThemedText style={{ fontSize: 14, fontWeight: "500", color: "#000" }}>
                  {t.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}
