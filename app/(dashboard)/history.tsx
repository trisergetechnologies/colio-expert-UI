// app/(private)/history.tsx
import React, { useState, useMemo } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { ThemedText } from "@/components/ThemedText";

const historyData = [
  {
    id: "1",
    type: "Chat",
    user: "Asha",
    status: "Completed",
    amount: "₹250",
    time: "Today, 10:30 AM",
    category: "Today",
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "2",
    type: "Call",
    user: "Rahul",
    status: "Missed",
    amount: "₹0",
    time: "Yesterday, 8:15 PM",
    category: "Yesterday",
    icon: "call-outline",
  },
  {
    id: "3",
    type: "Chat",
    user: "Maya",
    status: "Completed",
    amount: "₹400",
    time: "2 days ago",
    category: "All",
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "4",
    type: "Call",
    user: "Arjun",
    status: "Completed",
    amount: "₹150",
    time: "Sep 2, 5:45 PM",
    category: "All",
    icon: "call-outline",
  },
];

const categories = ["All", "Today", "Yesterday"];

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Today");

  // Filtered data based on category
  const filteredData = useMemo(() => {
    if (selectedCategory === "All") return historyData;
    return historyData.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <View
      className={`flex-1 px-4 pt-6 ${
        colorScheme === "dark" ? "bg-black" : "bg-beige"
      }`}
    >

      {/* Category Bar */}
      <View className="flex-row mb-4">
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`px-4 py-2 mx-2 rounded-2xl ${
              selectedCategory === cat
                ? "bg-blue-600"
                : "bg-white dark:bg-gray-700"
            }`}
          >
            <ThemedText
              className={`text-sm ${
                selectedCategory === cat ? "text-white" : "opacity-80"
              }`}
            >
              {cat}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <LinearGradient
            colors={
              colorScheme === "dark"
                ? ["#1e293b", "#0f172a"]
                : ["#fdf6e3", "#ffffff"]
            }
            className="rounded-2xl p-4 shadow-md mb-3"
            style={{ borderRadius: 16 }}
          >
            <View className="flex-row items-center justify-between">
              {/* Left Side */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
                  <Ionicons name={item.icon as any} size={20} color="#fff" />
                </View>
                <View>
                  <ThemedText className="font-semibold">
                    {item.type} with {item.user}
                  </ThemedText>
                  <ThemedText className="text-sm opacity-80 mt-1">
                    {item.time}
                  </ThemedText>
                </View>
              </View>

              {/* Right Side */}
              <View className="items-end">
                <ThemedText
                  className={`font-semibold ${
                    item.amount === "₹0" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {item.amount}
                </ThemedText>
                <ThemedText className="text-xs opacity-70">
                  {item.status}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        )}
      />
    </View>
  );
}
