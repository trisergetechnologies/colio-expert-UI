import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import GradientBackground from "@/components/Gradientbackground";

const initialNotifications = [
  {
    id: "1",
    title: "New Request",
    message: "You have received a new chat request.",
    time: "2 min ago",
    icon: "chatbubble-ellipses-outline",
    read: false,
  },
  {
    id: "2",
    title: "Payment Received",
    message: "₹500 credited to your wallet.",
    time: "1 hr ago",
    icon: "cash-outline",
    read: false,
  },
  {
    id: "3",
    title: "Rating Received",
    message: "A user rated you ★★★★★",
    time: "3 hrs ago",
    icon: "star-outline",
    read: true,
  },
  {
    id: "4",
    title: "Support Update",
    message: "Your support ticket has been resolved.",
    time: "Yesterday",
    icon: "help-circle-outline",
    read: true,
  },
];

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const handleOpenNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const renderNotification = ({ item }: { item: any }) => {
    const glowAnim = new Animated.Value(0);

    if (!item.read) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    const glowColor = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,157,118,0.3)", "rgba(255,157,118,0.6)"],
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleOpenNotification(item.id)}
      >
        <Animated.View
          style={{
            borderRadius: 16,
            shadowColor: !item.read ? glowColor : "transparent",
            shadowOpacity: !item.read ? 0.9 : 0,
            shadowRadius: !item.read ? 10 : 0,
          }}
          className="mb-4"
        >
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffeac7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] shadow-sm"
            style={{borderRadius:16}}
          >
            <View
              className={`flex-row items-center px-4 py-3 rounded-2xl ${
                item.read ? "bg-white/60" : "bg-white"
              }`}
            >
              <View
                className={`w-12 h-12 rounded-full ${
                  item.read ? "bg-[#ccc]" : "bg-[#ff9d76]"
                } items-center justify-center mr-3`}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.read ? "#555" : "#fff"}
                />
              </View>

              <View className="flex-1">
                <ThemedText
                  className={`font-semibold ${
                    item.read ? "text-black/70" : "text-black"
                  }`}
                >
                  {item.title}
                </ThemedText>
                <ThemedText
                  className={`text-sm mt-1 ${
                    item.read ? "text-black/50" : "text-black/70"
                  }`}
                >
                  {item.message}
                </ThemedText>
              </View>

              <ThemedText
                className={`text-xs ml-3 ${
                  item.read ? "text-black/40" : "text-black/60"
                }`}
              >
                {item.time}
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          {/* <ThemedText className="text-lg font-bold text-black">
            Notifications
          </ThemedText> */}

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              className="flex-row items-center mr-2"
            >
              <Ionicons name="checkmark-done-outline" size={22} color="black" />
              <ThemedText className="ml-1 font-medium text-black text-sm">
                Read All
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 70,
              paddingTop: 12,
              paddingHorizontal: 16,
            }}
            renderItem={renderNotification}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="notifications-off-outline" size={64} color="#ff9d76" />
            <ThemedText className="mt-3 text-black/70 text-base">
              You’re all caught up 🎉
            </ThemedText>
            <ThemedText className="text-black/50 text-sm mt-1">
              No new notifications
            </ThemedText>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}
