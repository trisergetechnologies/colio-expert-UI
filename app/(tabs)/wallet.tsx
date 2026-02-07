import GradientBackground from "@/components/Gradientbackground";
import { ThemedText } from "@/components/ThemedText";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";

// --- Types (UNCHANGED) ---
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

export default function ConsultantWalletScreen() {
  const router = useRouter();

  // State
  const [wallet, setWallet] = useState<ConsultantWallet | null>(null);
  const [stats, setStats] = useState<ConsultantStats | null>(null);
  const [recentActivity, setRecentActivity] =
    useState<RecentActivity | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Calls (UNCHANGED) ---
  const fetchData = async () => {
    try {
      setError(null);
      const token = await getToken();

      if (!token) {
        setError("Session expired. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const walletRes = await axios.get<WalletApiResponse>(
        `${API_BASE_URL}/user/wallet`,
        { headers }
      );

      if (walletRes.data.success && walletRes.data.data) {
        const data = walletRes.data.data;
        if (data.role === "consultant") {
          setWallet(data.wallet || null);
          setStats(data.consultantStats || null);
          setRecentActivity(data.recentActivity || null);
        } else {
          setError("User is not a consultant.");
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      const msg =
        err.response?.data?.message || "Failed to load wallet data.";
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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#5d0076" />
      </View>
    );
  }

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#000",
            }}
          >
            My Earnings
          </ThemedText>

          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {error ? (
            <View
              style={{
                backgroundColor: "#fef2f2",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ef4444" }}>{error}</Text>
              <TouchableOpacity
                onPress={fetchData}
                style={{ marginTop: 8 }}
              >
                <Text style={{ fontWeight: "700", textDecorationLine: "underline" }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 💰 Main Balance Card */}
              <LinearGradient
                colors={["#5d0076", "#330040"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 14,
                      fontWeight: "500",
                      marginBottom: 4,
                    }}
                  >
                    Available Balance
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 36,
                        fontWeight: "800",
                      }}
                    >
                      ₹{wallet?.available || 0}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 24,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                      }}
                    >
                      Pending Clearance
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      ₹{wallet?.pending || 0}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 1,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      marginHorizontal: 16,
                    }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                      }}
                    >
                      Lifetime Earnings
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      ₹{wallet?.totalEarned || 0}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* (Your commented block remains commented — unchanged) */}
            </>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
