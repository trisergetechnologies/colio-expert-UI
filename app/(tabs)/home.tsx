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
  FlatList,
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

 useFocusEffect(
  useCallback(() => {
    if (user?.consultantProfile?.availabilityStatus === "busy") {
      setDisable(true);
    } else {
      setDisable(false);
    }

    if (user?.consultantProfile?.availabilityStatus === "onWork") {
      setIsOnDuty(true);
    } else {
      setIsOnDuty(false);
    }

    fetchRecentConnections();
  }, [user])
);


  const handleAvailability = async () => {
    const token = await getToken();
    const url = `${API_BASE_URL}/consultant/availability`;
    const payload = isOnDuty ? "offWork" : "onWork";
    
   

    try {
      const res = await axios.put(
        url,
        { availabilityStatus: payload },
        { headers: { Authorization: `Bearer ${token}` } }
        
        
      );
         

      if (res.data.success) {
        const onDuty = !isOnDuty;
        setIsOnDuty(onDuty);
        ToastAndroid.show(
          res.data.data?.message || `You are now ${onDuty ? "Online" : "Offline"}`,
          ToastAndroid.SHORT
          
        );
      } else {
        ToastAndroid.show("Something went wrong. Try again.", ToastAndroid.SHORT);
        console.log("Something went wrong");
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
      ToastAndroid.show("Network error. Please try again later.", ToastAndroid.SHORT);
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

    // For consultant → show customers
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

// convert map → array
const uniqueConnections = Array.from(uniqueMap.values());

// 🔥 ISSUE 5 FIX: sort latest first
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

const formatLastSeen = (date?: string) => {
  if (!date) return "Just now";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

  const statsCards = [
    { id: "1", label: "Total Calls", value: "24", icon: "call-outline" },
    { id: "2", label: "Total Chats", value: "17", icon: "chatbubble-outline" },
    { id: "3", label: "Earnings", value: "₹3,280", icon: "wallet-outline" },
  ];

  const scrollX = useRef(new RNAnimated.Value(0)).current;
return (
  <GradientBackground>
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12">
        <ThemedText
          style={{
            fontFamily: "Pacifico_400Regular",
          }}
          className="text-4xl text-white"
        >
          Colio
        </ThemedText>

        <View className="flex-row items-center space-x-3">
          {/* Online Toggle */}
          {user?.consultantProfile?.availabilityStatus !== "busy" ? (
            <TouchableOpacity
              onPress={handleAvailability}
              disabled={disable}
              activeOpacity={0.8}
              className="flex-row items-center mr-3"
            >
              <View
                className={`w-11 h-6 rounded-full px-[2px] flex-row items-center ${
                  isOnDuty ? "bg-green-500" : "bg-black"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                    isOnDuty ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </View>
              <ThemedText
                className={`ml-2 text-sm font-semibold ${
                  isOnDuty ? "text-green-500" : "text-gray-300"
                }`}
              >
                {isOnDuty ? "Online" : "Offline"}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            // ================= BUSY STATE =================
            <View className="flex-row items-center mr-3">
              {/* Glowing orange dot */}
              <View className="w-3 h-3 rounded-full bg-orange-500 shadow-orange-500 shadow-lg mr-2" />

              <ThemedText className="text-sm font-semibold text-orange-400">
                Busy
              </ThemedText>
            </View>
          )}

          {/* Notification */}
          {/* <TouchableOpacity
              onPress={() => router.push("/(private)/notification")}
              className="bg-black rounded-full p-1"
            >
              <Ionicons name="notifications-outline" size={20} color="#FF00FF" />
            </TouchableOpacity> */}
        </View>
      </View>

      <View className="h-[1px] bg-white/30 w-full mt-3" />

      {/* Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Greeting */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="items-center"
        >
          <Image
            src={
              user?.avatar
                ? user.avatar
                : require("../../assets/images/professional.jpg")
            }
            className="w-36 h-36 rounded-full border-4 border-white/30 shadow-lg"
          />
          <ThemedText className="text-2xl font-extrabold text-white mt-5">
            {greeting}, {user?.name}
          </ThemedText>
          <ThemedText className="mt-3 text-center text-base text-white/80 px-10">
            Stay online to connect instantly with users looking for a real
            conversation.
          </ThemedText>
        </Animated.View>

        {/* Trending Topics */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          className="mt-8 px-5"
        >
          <ThemedText className="text-lg font-semibold text-white mb-3">
            Trending Topics 🔥
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {trendingTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white/20 px-4 py-2 mr-3 rounded-full border border-white/30"
              >
                <ThemedText className="text-white font-medium text-sm">
                  {topic}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Consultant Readiness */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          className="mt-8 px-5"
        >
          <ThemedText className="text-lg font-semibold text-white mb-3">
            Consultant Readiness
          </ThemedText>

          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76"]}
            className="rounded-2xl p-[1px]"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/85 rounded-2xl p-5">
              <View className="flex-row items-center mb-3">
                <Ionicons name="pulse-outline" size={22} color="#ff9d76" />
                <ThemedText className="ml-2 font-semibold text-black">
                  You’re Ready to Receive Requests
                </ThemedText>
              </View>

              <ThemedText className="text-black/70 text-sm leading-5">
                Keep your availability active and respond promptly to build
                trust, improve visibility, and increase earnings on Colio.
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/*  How You Earn on Colio */}
        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          className="mt-8 px-5"
        >
          <ThemedText className="text-lg font-semibold text-white mb-3">
            Your Growth on Colio
          </ThemedText>

          <View className="flex-row flex-wrap justify-between">
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
                className="rounded-2xl p-[1px] w-[47%] mb-3"
                style={{ borderRadius: 16 }}
              >
                <View className="bg-white/85 rounded-2xl p-4">
                  <Ionicons name={item.icon as any} size={22} color="#ff9d76" />
                  <ThemedText className="text-sm font-semibold text-black mt-2">
                    {item.title}
                  </ThemedText>
                  <ThemedText className="text-xs text-black/60 mt-1">
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
