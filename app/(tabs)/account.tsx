// app/(private)/account.tsx
import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function AccountScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [referralCode] = useState("COLIO1234");
  const { user, logout } = useAuth();

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const moreOptions = [
    { id: "11", label: "Chat", icon: "chatbubbles-outline", path: "../(private)/chat" },
    { id: "12", label: "Settlement", icon: "cash-outline", path: "../(dashboard)/settlement" },
    { id: "7", label: "About Us", icon: "information-circle-outline", path: "../(dashboard)/AboutUs" },
    { id: "8", label: "Quick-Assistance", icon: "headset-outline", path: "../(dashboard)/support" },
    { id: "5", label: "Terms & Conditions", icon: "document-text-outline", path: "../terms" },
    { id: "6", label: "Privacy Policy", icon: "lock-closed-outline", path: "../privacy" },
    { id: "9", label: "Logout", icon: "log-out-outline", isLogout: true },
  ];

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={{ alignItems: "center", marginTop: 24 }}>
          {user?.avatar ? (
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  borderWidth: 4,
                  borderColor: "#db2777",
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleImagePick}
              style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                backgroundColor: "#000",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="camera" size={40} color="#db2777" />
            </TouchableOpacity>
          )}

          <Text
            style={{
              color: "#000",
              fontSize: 20,
              fontWeight: "700",
              marginTop: 12,
            }}
          >
            {user?.name}
          </Text>
          <Text style={{ color: "#666", marginTop: 4 }}>{user?.phone}</Text>
        </View>

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 32,
            paddingHorizontal: 24,
          }}
        >
          {/* Calls */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/sessions")}
              style={{
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 16,
                borderRadius: 16,
                width: 96,
              }}
            >
              <Ionicons name="call-outline" size={24} color="#db2777" />
              <Text
                style={{
                  color: "#000",
                  fontWeight: "600",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                Calls
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Chat */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(private)/chat")}
              style={{
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 16,
                borderRadius: 16,
                width: 96,
              }}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#db2777" />
              <Text
                style={{
                  color: "#000",
                  fontWeight: "600",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                Chat
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Video */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/sessions")}
              style={{
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 16,
                borderRadius: 16,
                width: 96,
              }}
            >
              <Ionicons name="videocam-outline" size={24} color="#db2777" />
              <Text
                style={{
                  color: "#000",
                  fontWeight: "600",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                Video
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* More Options */}
        <FlatList
          data={moreOptions}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (item.label === "Logout") {
                  logout();
                } else {
                  router.push(item.path as any);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.isLogout ? "red" : "black"}
              />
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 16,
                  fontWeight: item.isLogout ? "700" : "500",
                  color: item.isLogout ? "#ef4444" : "#000",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Footer */}
        <View style={{ alignItems: "center", paddingTop: 16, marginBottom: 16 }}>
          <Text style={{ color: "#db2777", fontSize: 14 }}>Colio</Text>
        </View>
      </View>
    </GradientBackground>
  );
}
