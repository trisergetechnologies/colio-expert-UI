import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import GradientBackground from "@/components/Gradientbackground";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
  description: string;
};

type TransactionsData = {
  all: Transaction[];
  orders: Transaction[];
  transfers: Transaction[];
  pending: Transaction[];
};

const WalletScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<keyof TransactionsData>("all");

  const transactions: TransactionsData = {
    all: [
      {
        id: "1",
        type: "credit",
        amount: 500,
        date: "30 Aug 2025",
        time: "10:30 AM",
        description: "Referral Bonus",
      },
      {
        id: "2",
        type: "debit",
        amount: 200,
        date: "29 Aug 2025",
        time: "04:45 PM",
        description: "Order Payment",
      },
    ],
    orders: [
      {
        id: "3",
        type: "debit",
        amount: 200,
        date: "29 Aug 2025",
        time: "04:45 PM",
        description: "Order Payment",
      },
    ],
    transfers: [
      {
        id: "4",
        type: "debit",
        amount: 100,
        date: "28 Aug 2025",
        time: "07:15 PM",
        description: "UPI Transfer",
      },
    ],
    pending: [
      {
        id: "5",
        type: "credit",
        amount: 300,
        date: "27 Aug 2025",
        time: "09:00 AM",
        description: "Withdrawal Pending",
      },
    ],
  };

  // 🎨 Transaction Card
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <LinearGradient
      colors={["#fffaf3", "#ffd6a5", "#ffcc99"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl p-[1px] mb-3 shadow-sm"
      style={{borderRadius:16}}
    >
      <View className="flex-row justify-between items-center bg-white/70 rounded-xl p-3">
        <View>
          <Text className="font-semibold text-black">{item.description}</Text>
          <Text className="text-black/70 text-sm">
            {item.date} • {item.time}
          </Text>
        </View>
        <Text
          className={`font-bold ${
            item.type === "credit" ? "text-green-600" : "text-red-500"
          }`}
        >
          {item.type === "credit" ? "+" : "-"}₹{item.amount}
        </Text>
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
            Wallet
          </ThemedText> */}

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="000" />
            <ThemedText className="ml-1 font-medium text-black">Assist</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* 💰 Balance Card */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5", "#ffcc99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[1px] shadow-md mb-4"
            style={{borderRadius: 16}}
          >
            <View className="bg-white/70 rounded-2xl p-5">
              <Text className="text-black/70">Total Balance</Text>
              <Text className="text-3xl font-bold text-black mt-1">
                ₹1,250
              </Text>
              <TouchableOpacity
                className="flex-row items-center mt-4 rounded-full overflow-hidden self-start"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#ff9d76", "#ffd6a5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-row items-center px-4 py-2"
                  style={{borderRadius: 16}}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#000" />
                  <Text className="ml-2 text-black font-semibold">
                    Add Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Note */}
          <ThemedText className="text-black/70 text-sm mb-4">
            Refer to money transfer policy for withdrawals.
          </ThemedText>

          {/* 🎁 Refer & Earn Banner */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl p-4 mb-6 flex-row justify-between items-center shadow-sm"
            style={{borderRadius: 16}}
          >
            <Text className="font-semibold text-black">
              Refer & Earn Rewards 🎉
            </Text>
            <Ionicons name="gift-outline" size={28} color="#ff9d76" />
          </LinearGradient>

          {/* 🧾 Transactions Header */}
          <View className="flex-row justify-between items-center mb-3">
            <ThemedText className="text-lg font-bold text-black">
              Transaction History
            </ThemedText>
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="filter-outline" size={20} color="#ff9d76" />
              <ThemedText className="ml-1 text-black">Filter</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="pb-4">
            <View className="flex-row bg-white/70 rounded-full p-1">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "orders", label: "Orders" },
                  { key: "transfers", label: "Transfers" },
                  { key: "pending", label: "Pending" },
                ] as { key: keyof TransactionsData; label: string }[]
              ).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-1 items-center py-2 rounded-full ${
                    activeTab === tab.key ? "bg-[#ffd6a5]/80" : ""
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeTab === tab.key
                        ? "text-black font-semibold"
                        : "text-black/60"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </View>

          {/* 💳 Transactions List */}
          <FlatList
            data={transactions[activeTab]}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            scrollEnabled={false}
          />
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default WalletScreen;
