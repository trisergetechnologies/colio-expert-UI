import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import GradientBackground from "@/components/Gradientbackground";

const { width } = Dimensions.get("window");

type StatCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

function StatCard({ label, value, subtitle, icon }: StatCardProps) {
  return (
    <LinearGradient
      colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-[1px] mr-3 w-64 shadow-sm"
      style={{ borderRadius: 16 }}
    >
      <View className="bg-white/80 rounded-2xl p-4">
        <View className="flex-row items-start justify-between">
          <View>
            <ThemedText className="text-sm text-black/70">{label}</ThemedText>
            <ThemedText className="text-2xl font-bold text-black mt-2">
              {value}
            </ThemedText>
            {subtitle ? (
              <ThemedText className="text-xs text-black/60 mt-2">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {icon}
        </View>
      </View>
    </LinearGradient>
  );
}

function AnimatedBar({ value, max = 100 }: { value: number; max?: number }) {
  const height = useSharedValue(0);

  useEffect(() => {
    const percent = Math.max(0, Math.min(1, value / max));
    const finalHeight = percent * 120;
    height.value = withTiming(finalHeight, {
      duration: 700,
      easing: Easing.out(Easing.exp),
    });
  }, [value, max]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <View className="items-center">
      <Animated.View style={[style]} className="w-6 rounded-md bg-[#ff9d76]" />
      <ThemedText className="text-xs mt-2 text-black/70">{value}</ThemedText>
    </View>
  );
}

export default function PerformanceScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const earnings = {
    today: "₹1,250",
    week: "₹7,840",
    month: "₹28,500",
    wallet: "₹12,400",
  };

  const requestTrend = [
    { label: "Mon", v: 20 },
    { label: "Tue", v: 50 },
    { label: "Wed", v: 35 },
    { label: "Thu", v: 60 },
    { label: "Fri", v: 45 },
    { label: "Sat", v: 80 },
    { label: "Sun", v: 55 },
  ];

  const reviews = [
    { id: "1", name: "Asha", text: "Great guidance, very helpful!", rating: 5 },
    { id: "2", name: "Rahul", text: "Quick & accurate reading.", rating: 4 },
    { id: "3", name: "Maya", text: "Loved the clarity.", rating: 5 },
  ];

  // Detect scroll offset to highlight dots dynamically
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollX / 260); // approximate card width (64*4 + margin)
    setActiveIndex(newIndex);
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#000" />
            <ThemedText className="ml-1 font-medium text-black">Assist</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View className="px-4">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] mb-4 shadow-sm mt-3"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ffb085]/50 mr-3">
                  <Image
                    source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View>
                  <ThemedText className="text-lg font-bold text-black">
                    Pandit Ravi Sharma
                  </ThemedText>
                  <ThemedText className="text-sm text-black/70">
                    Astrologer • Vedic
                  </ThemedText>
                </View>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="rounded-full mr-2 bg-[#ff9d76] p-2"
                  onPress={() => router.push("/(dashboard)/history")}
                >
                  <Ionicons name="time-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="rounded-full bg-[#ff9d76] p-2"
                  onPress={() => router.push("/(dashboard)/support")}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Earnings Cards */}
        <View className="px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            className="mb-2"
          >
            <View className="flex-row items-stretch">
              <StatCard
                label="Today's Earnings"
                value={earnings.today}
                subtitle="Calls & Chats"
                icon={<Ionicons name="cash-outline" size={28} color="#10B981" />}
              />
              <StatCard
                label="This Week"
                value={earnings.week}
                subtitle="vs last week +12%"
                icon={<Ionicons name="bar-chart-outline" size={28} color="#06B6D4" />}
              />
              <StatCard
                label="Wallet"
                value={earnings.wallet}
                subtitle="Withdrawable"
                icon={<Ionicons name="wallet-outline" size={28} color="#F59E0B" />}
              />
            </View>
          </ScrollView>

          {/* Dots Indicator */}
          <View className="flex-row justify-center items-center mt-2 mb-4">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`w-2 h-2 mx-1 rounded-full ${
                  activeIndex === i ? "bg-black/80 scale-110" : "bg-black/30"
                }`}
              />
            ))}
          </View>
        </View>

        {/* Requests Trend */}
        <View className="px-4">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] mb-4 shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <ThemedText className="text-base font-semibold text-black">
                  Requests Trend
                </ThemedText>
                <ThemedText className="text-sm text-black/70">Last 7 days</ThemedText>
              </View>

              <View className="flex-row items-end justify-between px-2 py-3">
                {requestTrend.map((d, i) => (
                  <View key={i} className="items-center" style={{ width: (width - 64) / 8 }}>
                    <AnimatedBar value={d.v} max={80} />
                    <ThemedText className="text-xs mt-2 text-black/70">{d.label}</ThemedText>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center justify-between mt-4">
                <View>
                  <ThemedText className="font-semibold text-black">Total Requests</ThemedText>
                  <ThemedText className="text-sm text-black/60">
                    Accepted 78% • Missed 5%
                  </ThemedText>
                </View>
                <TouchableOpacity className="px-4 py-2 rounded-full bg-[#ff9d76]">
                  <ThemedText className="text-white font-semibold">Improve Accept</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Ratings & Reviews */}
        <View className="px-4">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] mb-4 shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <ThemedText className="text-base font-semibold text-black">
                  Ratings & Reviews
                </ThemedText>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <ThemedText className="ml-2 font-semibold text-black">4.8</ThemedText>
                </View>
              </View>

              <FlatList
                data={reviews}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <View className="py-3 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <ThemedText className="font-medium text-black">{item.name}</ThemedText>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <ThemedText className="ml-1 text-sm text-black">{item.rating}</ThemedText>
                      </View>
                    </View>
                    <ThemedText className="text-sm text-black/70 mt-1">{item.text}</ThemedText>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Availability */}
        <View className="px-4 mb-10">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ff9d76", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <View className="bg-white/80 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <ThemedText className="text-base font-semibold text-black">
                  Availability
                </ThemedText>
                <ThemedText className="text-sm text-black/70">Today</ThemedText>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <ThemedText className="font-semibold text-black">ON-DUTY</ThemedText>
                  <ThemedText className="text-sm text-black/70">08:00 - 20:00</ThemedText>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity className="px-4 py-2 rounded-full mr-3 bg-green-500">
                    <ThemedText className="text-white">Go Online</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-4 py-2 rounded-full border border-gray-300"
                    onPress={() => router.push("/(dashboard)/performance")}
                  >
                    <ThemedText className="text-black">Settings</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
