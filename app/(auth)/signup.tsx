import GradientBackground from "@/components/Gradientbackground";
import { API_BASE_URL } from "@/constants/onboarding";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  keyboardType = "default",
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "#161616", fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? "#ef4444" : "#f2c8a8",
          paddingHorizontal: 12,
        }}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8a8a8a"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          style={{ flex: 1, paddingVertical: 14, marginLeft: 8, color: "#111", fontSize: 15 }}
        />
      </View>
      {!!error && <Text style={{ color: "#ef4444", marginTop: 4, fontSize: 12 }}>{error}</Text>}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const { saveAuthData } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
  const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v.trim());

  const handleSignup = async () => {
    Keyboard.dismiss();
    setErrors({});

    if (!name.trim()) return setErrors({ name: "Please enter your full name" });
    if (!isValidEmail(email)) return setErrors({ email: "Please enter a valid email" });
    if (!isValidPhone(phone)) return setErrors({ phone: "Enter a 10-digit mobile number" });
    if (!password) return setErrors({ password: "Please enter password" });
    if (password !== confirmPassword) {
      return setErrors({ confirmPassword: "Passwords do not match" });
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/register-consultant`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });

      if (!res.data?.success || !res.data?.data) {
        return alert(res.data?.message || "Signup failed");
      }

      await saveAuthData(res.data.data);
      router.replace("/(onboarding)/personal-info");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 28, paddingBottom: 48 }}
        >
          <Text
            style={{
              fontFamily: "Pacifico_400Regular",
              fontSize: 44,
              color: "#121212",
              textAlign: "center",
              marginTop: 18,
            }}
          >
            Colio
          </Text>
          <Text style={{ textAlign: "center", color: "#3d3d3d", marginTop: 6 }}>
            Become a verified expert on Colio
          </Text>

          <View
            style={{
              marginTop: 24,
              backgroundColor: "rgba(255,255,255,0.74)",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#f1d6bf",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e1e1e", marginBottom: 12 }}>
              Create account
            </Text>

            <InputField
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your full legal name"
              icon={<MaterialIcons name="person-outline" size={20} color="#9b4d2e" />}
              error={errors.name}
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              icon={<MaterialIcons name="mail-outline" size={20} color="#9b4d2e" />}
              error={errors.email}
            />
            <InputField
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color="#9b4d2e" />}
              error={errors.phone}
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create password"
              secureTextEntry={!showPassword}
              icon={<Ionicons name="lock-closed-outline" size={20} color="#9b4d2e" />}
              error={errors.password}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Text style={{ fontSize: 12, color: "#595959", marginBottom: 8 }}>
                {showPassword ? "Hide" : "Show"} password
              </Text>
            </TouchableOpacity>

            <InputField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry={!showConfirm}
              icon={<Ionicons name="shield-checkmark-outline" size={20} color="#9b4d2e" />}
              error={errors.confirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm((s) => !s)}>
              <Text style={{ fontSize: 12, color: "#595959" }}>
                {showConfirm ? "Hide" : "Show"} confirm password
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            style={{
              marginTop: 20,
              backgroundColor: loading ? "#c6a9bb" : "#db2777",
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/auth")} style={{ marginTop: 14 }}>
            <Text style={{ textAlign: "center", color: "#2d2d2d" }}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
