import GradientBackground from "@/components/Gradientbackground";
import {
  API_BASE_URL,
  CONSULTANT_CATEGORIES,
  CONSULTANT_SKILLS,
  LANGUAGE_OPTIONS,
  SKILL_LABELS,
} from "@/constants/onboarding";
import DateTimePickerCompat, {
  hasNativeDateTimePicker,
} from "@/utils/dateTimePickerCompat";
import { getToken } from "@/utils/tokenHelper";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFallbackCalendar, setShowFallbackCalendar] = useState(false);
  const [draftDay, setDraftDay] = useState(1);
  const [draftMonth, setDraftMonth] = useState(0);
  const [draftYear, setDraftYear] = useState(1998);
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data?.data;
        if (d?.dateOfBirth) setDateOfBirth(new Date(d.dateOfBirth).toISOString().slice(0, 10));
        if (d?.gender) setGender(d.gender);
        if (d?.languages?.length) setLanguages(d.languages);
        if (d?.consultantProfile?.category) setCategory(d.consultantProfile.category);
        if (d?.consultantProfile?.skills?.length) setSkills(d.consultantProfile.skills);
        if (d?.consultantProfile?.bio) setBio(d.consultantProfile.bio);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const openDatePicker = () => {
    if (hasNativeDateTimePicker) {
      setShowDatePicker(true);
      return;
    }
    const seed = dateOfBirth ? new Date(dateOfBirth) : new Date(1998, 0, 1);
    setDraftDay(seed.getDate());
    setDraftMonth(seed.getMonth());
    setDraftYear(seed.getFullYear());
    setShowFallbackCalendar(true);
  };

  const maxDays = new Date(draftYear, draftMonth + 1, 0).getDate();
  const availableYears = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 18 - i);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const confirmFallbackDate = () => {
    const selected = new Date(draftYear, draftMonth, Math.min(draftDay, maxDays));
    setShowFallbackCalendar(false);
    setDateOfBirth(selected.toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!dateOfBirth.trim()) return alert("Please select date of birth");
    if (!gender) return alert("Select gender");
    if (!languages.length) return alert("Select at least one language");
    if (!category) return alert("Select a category");
    if (!skills.length) return alert("Select at least one skill");
    if (!bio.trim()) return alert("Enter bio");

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/consultant/onboarding/profile`,
        { dateOfBirth, gender, languages, category, skills, bio: bio.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.success) {
        return alert(res.data?.message || "Save failed");
      }
      router.replace("/(onboarding)/bank-details");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 42 }}>
          <Text style={{ fontSize: 13, color: "#7a7a7a", marginBottom: 4 }}>Step 1 of 4</Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#131313" }}>Personal details</Text>
          <Text style={{ color: "#494949", marginTop: 4, marginBottom: 16 }}>
            This information appears to users and helps with matching.
          </Text>

          <View style={{ backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f0d8c2" }}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Date of birth</Text>
            <TouchableOpacity
              onPress={openDatePicker}
              style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#edd9c8", padding: 12, marginBottom: 12 }}
            >
              <Text style={{ color: dateOfBirth ? "#111" : "#8b8b8b" }}>
                {dateOfBirth || "Tap to choose date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePickerCompat
                value={dateOfBirth ? new Date(dateOfBirth) : new Date(1998, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateOfBirth(selectedDate.toISOString().slice(0, 10));
                  }
                }}
              />
            )}
            <Modal visible={showFallbackCalendar} transparent animationType="fade" onRequestClose={() => setShowFallbackCalendar(false)}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 }}>Select date of birth</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Day</Text>
                      <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: "#ecd5c4", borderRadius: 10 }}>
                        {Array.from({ length: maxDays }).map((_, i) => {
                          const d = i + 1;
                          const selected = d === draftDay;
                          return (
                            <TouchableOpacity
                              key={`day-${d}`}
                              onPress={() => setDraftDay(d)}
                              style={{ paddingVertical: 10, alignItems: "center", backgroundColor: selected ? "#fce7f3" : "#fff" }}
                            >
                              <Text style={{ color: selected ? "#be185d" : "#222", fontWeight: selected ? "700" : "500" }}>{d}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Month</Text>
                      <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: "#ecd5c4", borderRadius: 10 }}>
                        {months.map((m, i) => {
                          const selected = i === draftMonth;
                          return (
                            <TouchableOpacity
                              key={`month-${m}`}
                              onPress={() => setDraftMonth(i)}
                              style={{ paddingVertical: 10, alignItems: "center", backgroundColor: selected ? "#fce7f3" : "#fff" }}
                            >
                              <Text style={{ color: selected ? "#be185d" : "#222", fontWeight: selected ? "700" : "500" }}>{m}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Year</Text>
                      <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: "#ecd5c4", borderRadius: 10 }}>
                        {availableYears.map((y) => {
                          const selected = y === draftYear;
                          return (
                            <TouchableOpacity
                              key={`year-${y}`}
                              onPress={() => setDraftYear(y)}
                              style={{ paddingVertical: 10, alignItems: "center", backgroundColor: selected ? "#fce7f3" : "#fff" }}
                            >
                              <Text style={{ color: selected ? "#be185d" : "#222", fontWeight: selected ? "700" : "500" }}>{y}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                  <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 16 }}>
                    <TouchableOpacity onPress={() => setShowFallbackCalendar(false)}>
                      <Text style={{ color: "#7a7a7a", fontWeight: "600" }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmFallbackDate}>
                      <Text style={{ color: "#db2777", fontWeight: "700" }}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Gender</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {(["male", "female", "other"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: gender === g ? "#db2777" : "#fff",
                    borderWidth: 1,
                    borderColor: gender === g ? "#db2777" : "#e2c9b3",
                  }}
                >
                  <Text style={{ color: gender === g ? "#fff" : "#333", textTransform: "capitalize" }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Languages</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {LANGUAGE_OPTIONS.map((l) => (
                <TouchableOpacity
                  key={l.value}
                  onPress={() => toggleItem(languages, setLanguages, l.value)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 15,
                    backgroundColor: languages.includes(l.value) ? "#db2777" : "#fff",
                    borderWidth: 1,
                    borderColor: languages.includes(l.value) ? "#db2777" : "#e2c9b3",
                  }}
                >
                  <Text style={{ color: languages.includes(l.value) ? "#fff" : "#333", fontSize: 12 }}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {CONSULTANT_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: category === c ? "#db2777" : "#fff",
                    borderWidth: 1,
                    borderColor: category === c ? "#db2777" : "#e2c9b3",
                  }}
                >
                  <Text style={{ color: category === c ? "#fff" : "#333", fontSize: 12 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Skills</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {CONSULTANT_SKILLS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleItem(skills, setSkills, s)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor: skills.includes(s) ? "#db2777" : "#fff",
                    borderWidth: 1,
                    borderColor: skills.includes(s) ? "#db2777" : "#e2c9b3",
                  }}
                >
                  <Text style={{ color: skills.includes(s) ? "#fff" : "#333", fontSize: 12 }}>
                    {SKILL_LABELS[s] || s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Bio</Text>
            <TextInput
              placeholder="Write a short introduction..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={5}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#edd9c8",
                padding: 12,
                textAlignVertical: "top",
                minHeight: 100,
              }}
            />
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
