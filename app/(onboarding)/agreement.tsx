import GradientBackground from "@/components/Gradientbackground";
import { HOST_AGREEMENT_FULL_TEXT, HOST_AGREEMENT_VERSION } from "@/constants/hostAgreement";
import { API_BASE_URL } from "@/constants/onboarding";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/utils/tokenHelper";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACK_ITEMS = [
  { key: "readUnderstood", label: "I have read and understood all terms of this Agreement." },
  { key: "voluntarily", label: "I am joining the Platform of my own free will." },
  { key: "contentPolicy", label: "I agree to comply with the content policy and strict prohibitions." },
  { key: "personalInfoLiability", label: "I understand the liability disclaimer related to personal info sharing." },
  { key: "ageEligibility", label: "I am at least 18 years old and legally competent to sign." },
  { key: "truthfulInfo", label: "All information provided by me is true and accurate." },
] as const;

export default function AgreementScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [ack, setAck] = useState<Record<string, boolean>>({});

  const allAck = useMemo(() => ACK_ITEMS.every((a) => ack[a.key]), [ack]);
  const nameOk = signedName.trim().toLowerCase() === (user?.name || "").trim().toLowerCase();

  const submit = async () => {
    if (!allAck) return alert("Please accept all acknowledgments");
    if (!signedName.trim()) return alert("Please type your full name");
    if (!nameOk) return alert("Signed name must match your registered name");

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/consultant/onboarding/agreement`,
        {
          signedName: signedName.trim(),
          version: HOST_AGREEMENT_VERSION,
          acknowledgments: {
            readUnderstood: true,
            voluntarily: true,
            contentPolicy: true,
            personalInfoLiability: true,
            ageEligibility: true,
            truthfulInfo: true,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) {
        const code = res.data?.code;
        alert(res.data?.message || "Submit failed");
        if (code === "INCOMPLETE_PROFILE") {
          router.replace("/(onboarding)/personal-info");
          return;
        }
        if (code === "INCOMPLETE_BANK") {
          router.replace("/(onboarding)/bank-details");
          return;
        }
        if (code === "INCOMPLETE_DOCUMENTS") {
          router.replace("/(onboarding)/documents");
          return;
        }
        return;
      }
      await refreshUser();
      router.replace("/(onboarding)/pending");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 42 }}>
          <Text style={{ fontSize: 13, color: "#7a7a7a", marginBottom: 4 }}>Step 4 of 4</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#131313" }}>Sign host agreement</Text>
          <Text style={{ color: "#494949", marginTop: 4, marginBottom: 16 }}>
            Read and digitally sign to submit for review (version {HOST_AGREEMENT_VERSION}).
          </Text>

          <View style={{ backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f0d8c2" }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#edd9c8", maxHeight: 280 }}>
              <ScrollView nestedScrollEnabled contentContainerStyle={{ padding: 12 }}>
                <Text style={{ fontSize: 11, lineHeight: 16, color: "#222" }}>{HOST_AGREEMENT_FULL_TEXT}</Text>
              </ScrollView>
            </View>

            <Text style={{ marginTop: 14, marginBottom: 8, fontWeight: "700", color: "#171717" }}>Acknowledgments</Text>
            {ACK_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setAck((p) => ({ ...p, [item.key]: !p[item.key] }))}
                style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: ack[item.key] ? "#db2777" : "#9ca3af",
                    backgroundColor: ack[item.key] ? "#db2777" : "#fff",
                    marginTop: 2,
                    marginRight: 10,
                  }}
                />
                <Text style={{ flex: 1, color: "#333", fontSize: 13 }}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ marginTop: 8, marginBottom: 6, fontWeight: "600" }}>
              Type your full name exactly: {user?.name || "—"}
            </Text>
            <TextInput
              value={signedName}
              onChangeText={setSignedName}
              placeholder="Full legal name"
              autoCapitalize="words"
              style={{
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: nameOk || !signedName ? "#edd9c8" : "#ef4444",
                borderRadius: 12,
                padding: 12,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={submit}
            disabled={loading || !allAck || !nameOk}
            style={{
              marginTop: 18,
              backgroundColor: loading || !allAck || !nameOk ? "#c6a9bb" : "#db2777",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Sign & submit</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
