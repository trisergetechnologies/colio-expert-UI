import GradientBackground from "@/components/Gradientbackground";
import { API_BASE_URL } from "@/constants/onboarding";
import { getToken } from "@/utils/tokenHelper";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Slot = "aadhaarFront" | "aadhaarBack" | "panCard" | "profilePhoto";

const LABELS: Record<Slot, string> = {
  aadhaarFront: "Aadhaar card (front)",
  aadhaarBack: "Aadhaar card (back)",
  panCard: "PAN card",
  profilePhoto: "Profile photo",
};

export default function DocumentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uris, setUris] = useState<Partial<Record<Slot, string>>>({});

  const pick = async (slot: Slot) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert("Photo permission is required.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setUris((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
    }
  };

  const appendFile = (form: FormData, field: string, uri?: string) => {
    if (!uri) return;
    form.append(field, { uri, name: `${field}.jpg`, type: "image/jpeg" } as any);
  };

  const submit = async () => {
    const required: Slot[] = ["aadhaarFront", "aadhaarBack", "panCard", "profilePhoto"];
    for (const key of required) {
      if (!uris[key]) return alert(`Please upload ${LABELS[key]}`);
    }

    try {
      setLoading(true);
      const token = await getToken();
      const form = new FormData();
      appendFile(form, "aadhaarFront", uris.aadhaarFront);
      appendFile(form, "aadhaarBack", uris.aadhaarBack);
      appendFile(form, "panCard", uris.panCard);
      appendFile(form, "profilePhoto", uris.profilePhoto);

      const res = await axios.post(`${API_BASE_URL}/consultant/onboarding/documents`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (!res.data?.success) {
        return alert(res.data?.message || "Upload failed");
      }
      router.replace("/(onboarding)/agreement");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 42 }}>
        <Text style={{ fontSize: 13, color: "#7a7a7a", marginBottom: 4 }}>Step 3 of 4</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#131313" }}>Verification documents</Text>
        <Text style={{ color: "#494949", marginTop: 4, marginBottom: 16 }}>
          Upload clear images for faster approval.
        </Text>

        <View style={{ backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f0d8c2" }}>
          {(Object.keys(LABELS) as Slot[]).map((slot) => (
            <View key={slot} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{LABELS[slot]}</Text>
              <TouchableOpacity
                onPress={() => pick(slot)}
                style={{
                  borderWidth: 1,
                  borderColor: "#edd9c8",
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  minHeight: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {uris[slot] ? (
                  <Image source={{ uri: uris[slot] }} style={{ width: "100%", height: 180 }} contentFit="cover" />
                ) : (
                  <Text style={{ color: "#8b8b8b" }}>Tap to select image</Text>
                )}
              </TouchableOpacity>
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
      </SafeAreaView>
    </GradientBackground>
  );
}
