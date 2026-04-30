import GradientBackground from "@/components/Gradientbackground";
import { API_BASE_URL } from "@/constants/onboarding";
import { getToken } from "@/utils/tokenHelper";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function BankDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const b = res.data?.data?.consultantProfile?.bankDetails;
        if (!b) return;
        setAccountHolderName(b.accountHolderName || "");
        setBankName(b.bankName || "");
        setAccountNumber(b.accountNumber || "");
        setIfscCode(b.ifscCode || "");
        setUpiId(b.upiId || "");
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const submit = async () => {
    if (
      !accountHolderName.trim() ||
      !bankName.trim() ||
      !accountNumber.trim() ||
      !ifscCode.trim() ||
      !upiId.trim()
    ) {
      return alert("Please fill all bank fields");
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/consultant/onboarding/profile`,
        {
          bankDetails: {
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            upiId: upiId.trim().toLowerCase(),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) {
        return alert(res.data?.message || "Save failed");
      }
      router.replace("/(onboarding)/documents");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const fields: [string, string, (v: string) => void, boolean][] = [
    ["Account holder name", accountHolderName, setAccountHolderName, false],
    ["Bank name", bankName, setBankName, false],
    ["Account number", accountNumber, setAccountNumber, false],
    ["IFSC code", ifscCode, setIfscCode, true],
    ["UPI ID", upiId, setUpiId, false],
  ];

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 42 }}>
          <Text style={{ fontSize: 13, color: "#7a7a7a", marginBottom: 4 }}>Step 2 of 4</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#131313" }}>Payout details</Text>
          <Text style={{ color: "#494949", marginTop: 4, marginBottom: 16 }}>
            Enter the account details where weekly payouts will be credited.
          </Text>

          <View style={{ backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f0d8c2" }}>
            {fields.map(([label, val, setVal, upper]) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: "600", marginBottom: 6 }}>{label}</Text>
                <TextInput
                  value={val}
                  onChangeText={(t) => setVal(upper ? t.toUpperCase() : t)}
                  autoCapitalize={upper ? "characters" : "none"}
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#edd9c8",
                    borderRadius: 12,
                    padding: 12,
                  }}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={{
              marginTop: 18,
              backgroundColor: loading ? "#c6a9bb" : "#db2777",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Continue</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
