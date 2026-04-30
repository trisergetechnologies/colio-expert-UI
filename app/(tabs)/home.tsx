import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Animated as RNAnimated,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const API_BASE_URL = "https://api.colio.in/api";

export default function HomeScreen() {
  const router = useRouter();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [disable, setDisable] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"onWork" | "offWork" | "busy">("offWork");
  const [greeting, setGreeting] = useState("Hello");
  const { user } = useAuth();
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Greeting setup
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    const st = user?.consultantProfile?.availabilityStatus;
    if (st === "onWork" || st === "offWork" || st === "busy") {
      setAvailabilityStatus(st);
      setIsOnDuty(st === "onWork");
      setDisable(st === "busy");
    }
  }, [user?.consultantProfile?.availabilityStatus]);

  const refreshAvailability = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/consultant/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data?.success) return;
      const st = res.data?.data?.availabilityStatus;
      if (st === "onWork" || st === "offWork" || st === "busy") {
        setAvailabilityStatus(st);
        setIsOnDuty(st === "onWork");
        setDisable(st === "busy");
      }
    } catch (error) {
      console.log("Failed to refresh availability", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshAvailability();
      fetchRecentConnections();
    }, [])
  );

  const handleAvailability = async () => {
    const token = await getToken();
    const url = `${API_BASE_URL}/consultant/availability`;
    const payload = availabilityStatus === "onWork" ? "offWork" : "onWork";

    try {
      const res = await axios.put(
        url,
        { availabilityStatus: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const nextStatus = res.data?.data?.availabilityStatus || payload;
        setAvailabilityStatus(nextStatus);
        setIsOnDuty(nextStatus === "onWork");
        setDisable(nextStatus === "busy");
        ToastAndroid.show(
          res.data.data?.message ||
            `You are now ${nextStatus === "onWork" ? "Online" : "Offline"}`,
          ToastAndroid.SHORT
        );
      } else {
        ToastAndroid.show(
          "Something went wrong. Try again.",
          ToastAndroid.SHORT
        );
        console.log("Something went wrong");
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
      ToastAndroid.show(
        "Network error. Please try again later.",
        ToastAndroid.SHORT
      );
    }
  };

  // Data for UI
  const trendingTopics = [
    "Career",
    "Life Talks",
    "Love",
    "Motivation",
    "Friendship",
    "Spirituality",
  ];

  const fetchRecentConnections = async () => {
    try {
      setLoadingRecent(true);
      const token = await getToken();

      const res = await axios.get(
        `${API_BASE_URL}/user/sessions?limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        setRecentConnections([]);
        return;
      }

      const sessions = res.data.data.sessions || [];

      const uniqueMap = new Map<string, any>();

      sessions.forEach((s: any) => {
        if (s.customer?._id && !uniqueMap.has(s.customer._id)) {
          uniqueMap.set(s.customer._id, {
            id: s.customer._id,
            name: s.customer?.name ?? "User",
            avatar: s.customer?.avatar,
            lastSeen: s.endedAt ?? s.startedAt,
            type: s.type,
            status: s.status,
          });
        }
      });

      const uniqueConnections = Array.from(uniqueMap.values());

      uniqueConnections.sort(
        (a, b) =>
          new Date(b.lastSeen).getTime() -
          new Date(a.lastSeen).getTime()
      );

      setRecentConnections(uniqueConnections);
    } catch (err) {
      console.error("Failed to fetch recent connections", err);
      setRecentConnections([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const scrollX = useRef(new RNAnimated.Value(0)).current;

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 48,
          }}
        >
          <ThemedText
            style={{
              fontFamily: "Pacifico_400Regular",
              fontSize: 32,
              color: "#9c0a67",
            }}
          >
            Colio
          </ThemedText>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {availabilityStatus !== "busy" ? (
              <TouchableOpacity
                onPress={handleAvailability}
                disabled={disable}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    paddingHorizontal: 2,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isOnDuty ? "#22c55e" : "black",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "white",
                      transform: [
                        {
                          translateX: isOnDuty ? 20 : 0,
                        },
                      ],
                    }}
                  />
                </View>

                <ThemedText
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "600",
                    color: isOnDuty ? "#22c55e" : "#d1d5db",
                  }}
                >
                  {isOnDuty ? "Online" : "Offline"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#f97316",
                    marginRight: 8,
                    shadowColor: "#f97316",
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                  }}
                />

                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#fb923c",
                  }}
                >
                  Busy
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.3)",
            width: "100%",
            marginTop: 12,
          }}
        />

        {/* Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, marginTop: 16 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Greeting */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={{ alignItems: "center" }}
          >
            <Image
              source={
                user?.avatar
                  ? { uri: user.avatar }
                  : require("../../assets/images/professional.jpg")
              }
              style={{
                width: 144,
                height: 144,
                borderRadius: 72,
                borderWidth: 4,
                borderColor: "rgba(255,255,255,0.3)",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 6,
              }}
            />

            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#9d174d",
                marginTop: 20,
              }}
            >
              {greeting}, {user?.name}
            </ThemedText>

            <ThemedText
              style={{
                marginTop: 12,
                textAlign: "center",
                fontSize: 16,
                color: "#9d174d",
                paddingHorizontal: 40,
              }}
            >
              Stay online to connect instantly with users looking for a real
              conversation.
            </ThemedText>
          </Animated.View>

          {/* Trending Topics */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={{ marginTop: 32, paddingHorizontal: 20 }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#9d174d",
                marginBottom: 12,
              }}
            >
              Trending Topics 🔥
            </ThemedText>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: "row" }}
            >
              {trendingTopics.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginRight: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <ThemedText
                    style={{
                      color: "#e40632",
                      fontWeight: "500",
                      fontSize: 14,
                    }}
                  >
                    {topic}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Consultant Readiness */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={{ marginTop: 32, paddingHorizontal: 20 }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#9d174d",
                marginBottom: 12,
              }}
            >
              Consultant Readiness
            </ThemedText>

            <LinearGradient
              colors={["#fffaf3", "#ffd6a5", "#ff9d76"]}
              style={{
                borderRadius: 16,
                padding: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="pulse-outline"
                    size={22}
                    color="#ff9d76"
                  />
                  <ThemedText
                    style={{
                      marginLeft: 8,
                      fontWeight: "600",
                      color: "black",
                    }}
                  >
                    You’re Ready to Receive Requests
                  </ThemedText>
                </View>

                <ThemedText
                  style={{
                    color: "rgba(0,0,0,0.7)",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  Keep your availability active and respond promptly to build
                  trust, improve visibility, and increase earnings on Colio.
                </ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Your Growth on Colio */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={{ marginTop: 32, paddingHorizontal: 20 }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#9d174d",
                marginBottom: 12,
              }}
            >
              Your Growth on Colio
            </ThemedText>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {[
                {
                  id: "1",
                  icon: "call-outline",
                  title: "Calls & Video",
                  desc: "Earn per minute for every session you accept",
                },
                {
                  id: "2",
                  icon: "chatbubble-ellipses-outline",
                  title: "Chats",
                  desc: "Respond quickly to increase repeat users",
                },
                {
                  id: "3",
                  icon: "checkmark-circle-outline",
                  title: "Availability",
                  desc: "Staying online increases request visibility",
                },
                {
                  id: "4",
                  icon: "wallet-outline",
                  title: "Weekly Payouts",
                  desc: "Secure, automated settlements",
                },
              ].map((item) => (
                <LinearGradient
                  key={item.id}
                  colors={["#fffaf3", "#ffd6a5", "#ff9d76"]}
                  style={{
                    borderRadius: 16,
                    padding: 1,
                    width: "47%",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.85)",
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color="#ff9d76"
                    />
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "black",
                        marginTop: 8,
                      }}
                    >
                      {item.title}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: "rgba(0,0,0,0.6)",
                        marginTop: 4,
                      }}
                    >
                      {item.desc}
                    </ThemedText>
                  </View>
                </LinearGradient>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
