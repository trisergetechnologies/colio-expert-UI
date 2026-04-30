import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";

/* ✅ Toast Component */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!message) return;
    if (visible) {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2100),
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, message]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 40,
        backgroundColor: "rgba(30, 23, 36, 0.95)",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
        {message}
      </Text>
    </Animated.View>
  );
}

/* ✅ Styled Input Field */
const CardInput = React.memo(
  ({
    leftIcon,
    placeholder,
    value,
    onChange,
    secure = false,
    rightIcon,
    onRightPress,
    keyboardType = "default",
    errorMessage,
  }: {
    leftIcon?: React.ReactNode;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    secure?: boolean;
    rightIcon?: React.ReactNode;
    onRightPress?: () => void;
    keyboardType?: any;
    errorMessage?: string;
  }) => (
    <View style={{ marginBottom: 12, marginTop: 24 }}>
      <LinearGradient
        colors={["#fffaf3", "#db2777"]}
        start={{ x: 2, y: 0 }}
        end={{ x: 2, y: 0 }}
        style={{ borderRadius: 16 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 12,
            paddingVertical: 16,
          }}
        >
          <View style={{ width: 36, alignItems: "center", marginRight: 8 }}>
            {leftIcon}
          </View>

          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#d8bfd8"
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            secureTextEntry={secure}
            autoCapitalize="none"
            style={{
              flex: 1,
              color: "white",
              fontSize: 16,
            }}
          />

          {rightIcon ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={{ marginLeft: 12, padding: 4 }}
            >
              {rightIcon}
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {errorMessage ? (
        <Text
          style={{
            color: "#f87171",
            fontSize: 12,
            marginTop: 8,
            marginLeft: 8,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  )
);

/* ✅ Consultant Login Screen */
export default function ConsultantLoginScreen() {
  const router = useRouter();
  const { saveAuthData } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({
    msg: "",
    visible: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const headerFade = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  /* ✅ Validators */
  const isValidEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
  const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v.trim());

  const showToast = (m: string) => {
    setToast({ msg: m, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2400);
  };

  /* ✅ Login Flow */
  const handleLogin = async () => {
    Keyboard.dismiss();
    setErrors({});

    if (!identifier.trim())
      return setErrors({ identifier: "Enter email or phone" });
    if (!password) return setErrors({ password: "Enter password" });

    let loginType: "email" | "phone" = "email";
    if (identifier.includes("@")) loginType = "email";
    else if (/^[0-9]+$/.test(identifier.trim())) loginType = "phone";

    if (loginType === "email" && !isValidEmail(identifier))
      return setErrors({ identifier: "Invalid email" });
    if (loginType === "phone" && !isValidPhone(identifier))
      return setErrors({ identifier: "Enter 10-digit phone" });

    try {
      setLoading(true);
      const payload = {
        identifier: identifier.trim().toLowerCase(),
        password,
        loginType,
        role: "consultant",
      };

      const res = await axios.post(`${API_BASE_URL}/auth/login`, payload);

      if (res.data?.success && res.data?.data) {
        console.log("this is data after login", res.data.data);
        await saveAuthData(res.data.data);
        showToast("Login successful!");
        router.replace("/(tabs)/home");
      } else {
        showToast(res.data?.message || "Invalid credentials");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ✅ Render */
  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 48,
              opacity: headerFade,
              transform: [
                {
                  translateY: headerFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            }}
          >
            <Text
              style={{
                color: "black",
                fontSize: 60,
                paddingTop: 64,
                fontFamily: "Pacifico_400Regular",
              }}
            >
              Colio
            </Text>

            <Text
              style={{
                color: "black",
                marginTop: 8,
                fontSize: 14,
                paddingHorizontal: 48,
                textAlign: "center",
              }}
            >
              Login to your consultant account
            </Text>
          </Animated.View>

          {/* Login Form */}
          <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
            <CardInput
              leftIcon={
                <MaterialIcons
                  name="email"
                  size={20}
                  color="#e9e7ec"
                />
              }
              placeholder="Email"
              value={identifier}
              onChange={setIdentifier}
              errorMessage={errors.identifier}
            />

            <CardInput
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#e9e7ec"
                />
              }
              placeholder="Password"
              value={password}
              onChange={setPassword}
              secure={!showPassword}
              errorMessage={errors.password}
              rightIcon={
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#e9e7ec"
                />
              }
              onRightPress={() => setShowPassword((s) => !s)}
            />

            <View style={{ alignItems: "flex-end", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => showToast("Password reset coming soon")}
              >
                <Text style={{ color: "black" }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              style={{ marginBottom: 16 }}
            >
              <Text style={{ color: "black", textAlign: "center", fontSize: 14 }}>
                New here? Become a Colio Expert
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={["#db2777", "#db2777"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#a855f7",
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    Login
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 48 }}>
            <Text
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
              }}
            >
              Your number is used only for secure login & verification.
            </Text>
          </View>
        </ScrollView>

        <Toast message={toast.msg} visible={toast.visible} />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
