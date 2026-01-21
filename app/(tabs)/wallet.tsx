import GradientBackground from "@/components/Gradientbackground"; // Assuming you have this
import { ThemedText } from "@/components/ThemedText"; // Assuming you have this
import { getToken } from "@/utils/tokenHelper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";

// --- Types based on Consultant Backend Response ---
type ConsultantWallet = {
  available: number;
  pending: number;
  totalEarned: number;
};

type ConsultantStats = {
  totalSessions: number;
  ratingAverage: number;
  ratingCount: number;
};

type RecentActivity = {
  last30DaysEarned: number;
  last30DaysSessions: number;
  last30DaysMinutes: number;
};

type Transaction = {
  id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  paymentMethod: string;
  razorpayOrderId?: string;
  createdAt: string;
};

type WalletApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    role: "customer" | "consultant";
    wallet?: ConsultantWallet;
    consultantStats?: ConsultantStats;
    recentActivity?: RecentActivity;
  };
};

type TransactionsApiResponse = {
  success: boolean;
  data: {
    pagination: {
      currentPage: number;
      totalPages: number;
    };
    transactions: Transaction[];
  };
};

export default function ConsultantWalletScreen() {
  const router = useRouter();
  
  // State
  const [wallet, setWallet] = useState<ConsultantWallet | null>(null);
  const [stats, setStats] = useState<ConsultantStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Calls ---

  const fetchData = async () => {
    try {
      setError(null);
      const token = await getToken();
      
      if (!token) {
        setError("Session expired. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Wallet Balance & Stats
      const walletRes = await axios.get<WalletApiResponse>(
        `${API_BASE_URL}/user/wallet`,
        { headers }
      );

      if (walletRes.data.success && walletRes.data.data) {
        const data = walletRes.data.data;
        if (data.role === 'consultant') {
          setWallet(data.wallet || null);
          setStats(data.consultantStats || null);
          setRecentActivity(data.recentActivity || null);
        } else {
          setError("User is not a consultant.");
        }
      }

      // 2. Fetch Transactions (Page 1)
      const txRes = await axios.get<TransactionsApiResponse>(
        `${API_BASE_URL}/user/transactions?page=1&limit=10`,
        { headers }
      );

      if (txRes.data.success) {
        setTransactions(txRes.data.data.transactions);
      }

    } catch (err: any) {
      console.error("Fetch error:", err);
      const msg = err.response?.data?.message || "Failed to load wallet data.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#5d0076" />
      </View>
    );
  }

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-lg font-bold text-black">My Earnings</ThemedText>
          <TouchableOpacity className="p-2">
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error ? (
            <View className="bg-red-50 p-4 rounded-xl items-center">
              <Text className="text-red-500">{error}</Text>
              <TouchableOpacity onPress={fetchData} className="mt-2">
                <Text className="font-bold underline">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 💰 Main Balance Card */}
              <LinearGradient
                colors={["#5d0076", "#330040"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6 mb-6 shadow-lg"
                style={{ borderRadius: 24 }}
              >
                <View>
                  <Text className="text-white/80 text-sm font-medium mb-1">Available Balance</Text>
                  <View className="flex-row items-center">
                    <Text className="text-white text-4xl font-extrabold">
                      ₹{wallet?.available || 0}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-6 pt-4 border-t border-white/20">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs">Pending Clearance</Text>
                    <Text className="text-white text-lg font-bold">₹{wallet?.pending || 0}</Text>
                  </View>
                  <View className="w-[1px] bg-white/20 h-full mx-4" />
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs">Lifetime Earnings</Text>
                    <Text className="text-white text-lg font-bold">₹{wallet?.totalEarned || 0}</Text>
                  </View>
                </View>
              </LinearGradient>

              

              {/* 🚀 Last 30 Days Summary */}
              {/* {recentActivity && (
                <View className="bg-purple-50 p-4 rounded-2xl mb-6 border border-purple-100 flex-row items-center justify-between">
                  <View>
                    <Text className="text-purple-900 font-bold text-base">Last 30 Days</Text>
                    <Text className="text-purple-700 text-xs">Performance summary</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-purple-900 font-bold text-xl">
                      ₹{recentActivity.last30DaysEarned}
                    </Text>
                    <Text className="text-purple-700 text-xs">Earned</Text>
                  </View>
                </View>
              )} */}
            </>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}