import GradientBackground from "@/components/Gradientbackground";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";

/** ------------------------------------------------------------------
 * CATEGORY COMPONENT
 * ------------------------------------------------------------------ */
type Category = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORY_LIST: Category[] = [
  { id: "all", label: "All", icon: "grid-outline" },
  { id: "call", label: "Call", icon: "call-outline" },
  { id: "chat", label: "Chat", icon: "chatbubble-outline" },
  { id: "video", label: "Video", icon: "videocam-outline" },
  { id: "reviews", label: "Reviews", icon: "star-outline" },
  { id: "earnings", label: "Earnings", icon: "cash-outline" },
  { id: "updates", label: "Updates", icon: "notifications-outline" },
];

const CategoryTabs: React.FC<{
  active: string;
  onSelect: (id: string) => void;
}> = ({ active, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 mb-3"
      contentContainerStyle={{ paddingVertical: 6 }}
    >
      {CATEGORY_LIST.map((cat) => {
        const isActive = active === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.9}
            className="mr-3"
            style={{ flexShrink: 0 }}
          >
            <LinearGradient
              colors={
                isActive
                  ? ["#ffd6a5", "#ff9d76", "#ffeac7"]
                  : ["#fffaf3", "#fffaf3"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-row items-center justify-center px-5 py-3 rounded-full shadow-sm"
              style={{
                minWidth: 100,
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={cat.icon}
                size={17}
                color={isActive ? "#000" : "#555"}
              />
              <Text
                className={`ml-2 text-sm ${
                  isActive ? "text-black font-semibold" : "text-black/60"
                }`}
              >
                {cat.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

/** ------------------------------------------------------------------
 * DUMMY ACTIVITY DATA
 * ------------------------------------------------------------------ */
type Activity = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  date: string;
  image?: string;
  amount?: string;
};

const ACTIVITY_DATA: Activity[] = [
  {
    id: "a1",
    type: "bookings",
    title: "Consultation Booking",
    subtitle: "Scheduled for 15 Sept, 2:30 PM",
    date: "Today",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    id: "a2",
    type: "reviews",
    title: "New 5-Star Review",
    subtitle: "“Very professional and kind.”",
    date: "Yesterday",
  },
  {
    id: "a3",
    type: "earnings",
    title: "Payment Received",
    subtitle: "From: Riya Sharma",
    date: "10 Sept 2025",
    amount: "+₹850",
  },
  {
    id: "a4",
    type: "updates",
    title: "App Update Available",
    subtitle: "Version 2.1 includes UI improvements.",
    date: "9 Sept 2025",
  },
  {
    id: "a5",
    type: "bookings",
    title: "Follow-up Call",
    subtitle: "Scheduled for 18 Sept, 10:00 AM",
    date: "8 Sept 2025",
    image: "https://randomuser.me/api/portraits/women/34.jpg",
  },
];

/** ------------------------------------------------------------------
 * MAIN SCREEN
 * ------------------------------------------------------------------ */
export default function ActivityScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredData = useMemo(() => {
    if (activeCategory === "all") return ACTIVITY_DATA;
    return ACTIVITY_DATA.filter((a) => a.type === activeCategory);
  }, [activeCategory]);

  const renderCard = ({ item }: { item: Activity }) => (
    <LinearGradient
      colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-[1px] mb-3 shadow-sm"
      style={{borderRadius: 16}}
    >
      <View className="flex-row items-center justify-between bg-white/70 rounded-2xl px-4 py-3">
        <View className="flex-row items-center flex-1">
          {item.image && (
            <Image
              source={{ uri: item.image }}
              className="w-10 h-10 rounded-full border-2 border-[#ffb085]/50 mr-3"
            />
          )}
          <View className="flex-1">
            <Text className="text-black font-semibold">{item.title}</Text>
            {item.subtitle && (
              <Text className="text-black/60 text-xs mt-0.5">
                {item.subtitle}
              </Text>
            )}
            <Text className="text-black/50 text-xs mt-1">{item.date}</Text>
          </View>
        </View>
        {item.amount && (
          <Text className="text-green-600 font-bold text-base">
            {item.amount}
          </Text>
        )}
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
          <Text className="text-lg font-bold text-black">Activity</Text>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <Text className="ml-1 font-medium text-black">Assist</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <CategoryTabs active={activeCategory} onSelect={setActiveCategory} />

        {/* Activity List */}
        {filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="mt-10 items-center">
            <Text className="text-black/50 text-sm">
              No activity in this category 🚀
            </Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}
