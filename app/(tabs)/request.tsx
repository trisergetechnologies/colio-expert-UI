import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import GradientBackground from "@/components/Gradientbackground";
import { useRouter } from "expo-router";

// Types
type RequestItem = {
  id: string;
  name: string;
  image: string;
  balance: string;
};
type TabKey = "All" | "Call" | "Chat";

const tabs: TabKey[] = ["All", "Call", "Chat"];

const dummyData: Record<TabKey, RequestItem[]> = {
  All: [
    {
      id: "1",
      name: "Arjun Mehta",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      balance: "Verified",
    },
    {
      id: "2",
      name: "Priya Sharma",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      balance: "Verified",
    },
  ],
  Call: [
    {
      id: "3",
      name: "Rohit Singh",
      image: "https://randomuser.me/api/portraits/men/12.jpg",
      balance: "Verified",
    },
  ],
  Chat: [
    {
      id: "4",
      name: "Ananya Gupta",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      balance: "Verified",
    },
  ],
};

export default function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const indicator = useSharedValue(0);
  const router = useRouter();

  const handleTabPress = (index: number, tab: TabKey) => {
    setActiveTab(tab);
    indicator.value = withTiming(index * 100);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicator.value }],
  }));

  // 🎨 Render Request Card with Linear Gradient
  const renderRequestCard = ({ item }: { item: RequestItem }) => (
    <LinearGradient
      colors={["#fffaf3", "#ffd6a5", "#ffcc99"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-[1px] mb-4 shadow-md"
      style={
        {borderRadius:16}
      }
    >
      <View className="flex-row items-center rounded-2xl bg-white/70 p-5">
        <Image
          source={{ uri: item.image }}
          className="w-16 h-16 rounded-full mr-4 border-2 border-[#ffb085]/60"
        />
        <View className="flex-1">
          <ThemedText className="font-semibold text-black text-lg">
            {item.name}
          </ThemedText>
          <ThemedText className="text-black/70 text-sm">
            Status: {item.balance}
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          className="rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={["#ff9d76", "#ffd6a5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-4 py-2"
          >
            <ThemedText className="text-black font-semibold">Accept</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          {/* <ThemedText className="text-lg font-bold text-black">
            Requests
          </ThemedText> */}

          {/* <TouchableOpacity
            onPress={() => router.push("/(private)/notification")}
            className="bg-black rounded-full p-2 shadow"
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#22c55e"
            />
          </TouchableOpacity> */}
        </View>

        {/* Tabs */}
        <LinearGradient
          colors={["#fffaf3", "#ffd6a5", "#ffcc99"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative flex-row mx-4 mt-5 mb-3 rounded-full shadow overflow-hidden border border-[#ffd6a5]/70"
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 items-center py-3"
              onPress={() => handleTabPress(index, tab)}
              activeOpacity={0.9}
            >
              <ThemedText
                className={`text-base ${
                  activeTab === tab
                    ? "font-semibold text-black"
                    : "font-normal text-black/60"
                }`}
              >
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}

          {/* Active Tab Highlight */}
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: 0,
                height: "100%",
                width: "33.33%",
                borderRadius: 9999,
              },
              indicatorStyle,
            ]}
          >
            <LinearGradient
              colors={["#ffd6a5", "#ff9d76", "#ffeac7"]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 2 }}
              className="flex-2 opacity-80"
            />
          </Animated.View>
        </LinearGradient>

        {/* List */}
        <FlatList
          data={dummyData[activeTab]}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestCard}
          contentContainerStyle={{ padding: 16 }}
        />
      </View>
    </GradientBackground>
  );
}
