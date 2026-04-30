import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { refreshUser, user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.consultantProfile?.applicationStatus === "approved") {
      router.replace("/(tabs)/home");
    }
  }, [user?.consultantProfile?.applicationStatus, router]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const checkStatus = async () => {
    setBusy(true);
    await refreshUser();
    setBusy(false);
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1, padding: 22, justifyContent: "center" }}>
        <View style={{ backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#f0d8c2" }}>
          <Text style={{ fontSize: 25, fontWeight: "800", color: "#171717", textAlign: "center" }}>
            Application submitted
          </Text>
          <Text style={{ marginTop: 12, color: "#4a4a4a", textAlign: "center", fontSize: 15, lineHeight: 22 }}>
            Your profile is now under review. You can check your approval status anytime.
          </Text>

          <TouchableOpacity
            onPress={checkStatus}
            disabled={busy}
            style={{
              marginTop: 20,
              backgroundColor: busy ? "#c6a9bb" : "#db2777",
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Check status</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => logout()} style={{ marginTop: 14, alignItems: "center" }}>
            <Text style={{ color: "#5f5f5f" }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
