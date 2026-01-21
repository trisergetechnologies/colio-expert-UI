// app/(dashboard)/settlement.tsx
import GradientBackground from "@/components/Gradientbackground";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";

// ================= TYPES =================
interface BankSnapshot {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

interface SettlementPeriod {
  from?: string;
  to?: string;
}

interface Settlement {
  _id: string;
  consultant: string;
  amount: number;
  currency: string;
  bankSnapshot: BankSnapshot;
  status: "pending" | "approved" | "settled" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  utr?: string;
  rejectionReason?: string;
  generatedBy: "cron" | "manual" | "system";
  settlementPeriod?: SettlementPeriod;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    settlements: Settlement[];
    pagination: Pagination;
  } | null;
}

// ================= STATUS CONFIG =================
const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  pending: {
    color: "#f59e0b",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    icon: "time-outline",
    label: "Pending",
  },
  approved: {
    color: "#3b82f6",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    icon: "checkmark-circle-outline",
    label: "Approved",
  },
  settled: {
    color: "#22c55e",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
    icon: "checkmark-done-circle-outline",
    label: "Settled",
  },
  rejected: {
    color: "#ef4444",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
    icon: "close-circle-outline",
    label: "Rejected",
  },
};

// ================= FILTER OPTIONS =================
const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Settled", value: "settled" },
  { label: "Rejected", value: "rejected" },
];

export default function SettlementScreen() {
  const router = useRouter();

  // ================= STATE =================
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ================= FETCH SETTLEMENTS =================
  const fetchSettlements = async (
    page: number = 1,
    append: boolean = false,
    status: string = "",
  ) => {
    const token = await getToken();
    try {
      if (!isMounted.current) return;

      if (page === 1 && !append) {
        setIsLoading(true);
      } else if (append) {
        setIsLoadingMore(true);
      }
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (status) {
        queryParams.append("status", status);
      }

      const response = await fetch(
        `${API_BASE_URL}/consultant/getsettlements?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data: ApiResponse = await response.json();

      if (!isMounted.current) return;

      if (data.success && data.data) {
        if (append) {
          setSettlements((prev) => [...prev, ...data.data!.settlements]);
        } else {
          setSettlements(data.data.settlements);
        }
        setPagination(data.data.pagination);
        setCurrentPage(data.data.pagination.page);
      } else {
        setError(data.message || "Failed to fetch settlements");
      }
    } catch (err) {
      console.error("Fetch settlements error:", err);
      if (isMounted.current) {
        setError("Network error. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    }
  };

  // ================= INITIAL FETCH & FILTER CHANGE =================
  useEffect(() => {
    setCurrentPage(1);
    setSettlements([]);
    fetchSettlements(1, false, selectedFilter);
  }, [selectedFilter]);

  // ================= HANDLERS =================
  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchSettlements(1, false, selectedFilter);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !isLoadingMore && !isLoading) {
      fetchSettlements(currentPage + 1, true, selectedFilter);
    }
  };

  const handleFilterChange = (status: string) => {
    if (status !== selectedFilter) {
      setSelectedFilter(status);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.length <= 4)
      return accountNumber || "****";
    return "****" + accountNumber.slice(-4);
  };

  // ================= RENDER SETTLEMENT CARD =================
  const renderSettlementCard = ({ item }: { item: Settlement }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <TouchableOpacity activeOpacity={0.8} className="mx-4 mb-4">
        <LinearGradient
          colors={["#ffffff", "#fefefe"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16 }}
          className="shadow-lg"
        >
          <View className="p-4">
            {/* Header Row: Amount & Status */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatAmount(item.amount, item.currency)}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              <View
                className={`flex-row items-center px-3 py-1.5 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}
              >
                <Ionicons
                  name={statusConfig.icon}
                  size={14}
                  color={statusConfig.color}
                />
                <Text
                  className="ml-1.5 text-xs font-semibold"
                  style={{ color: statusConfig.color }}
                >
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-gray-100 my-3" />

            {/* Bank Details */}
            <View className="mb-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="business-outline" size={16} color="#6b7280" />
                <Text className="ml-2 text-sm font-medium text-gray-700">
                  {item.bankSnapshot?.bankName || "Bank Name N/A"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={16} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-600">
                    A/C: {maskAccountNumber(item.bankSnapshot?.accountNumber)}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">
                  IFSC: {item.bankSnapshot?.ifscCode || "N/A"}
                </Text>
              </View>

              {item.bankSnapshot?.upiId && (
                <View className="flex-row items-center mt-1.5">
                  <Ionicons name="qr-code-outline" size={16} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-600">
                    UPI: {item.bankSnapshot.upiId}
                  </Text>
                </View>
              )}
            </View>

            {/* UTR (if approved/settled) */}
            {item.utr && (
              <View className="bg-green-50 rounded-lg px-3 py-2 mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text className="ml-2 text-xs text-green-700 font-medium">
                    UTR: {item.utr}
                  </Text>
                </View>
              </View>
            )}

            {/* Rejection Reason */}
            {item.status === "rejected" && item.rejectionReason && (
              <View className="bg-red-50 rounded-lg px-3 py-2 mb-3">
                <View className="flex-row items-start">
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color="#ef4444"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2 text-xs text-red-700 flex-1">
                    {item.rejectionReason}
                  </Text>
                </View>
              </View>
            )}

            {/* Settlement Period */}
            {item.settlementPeriod?.from && item.settlementPeriod?.to && (
              <View className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">
                  Settlement Period
                </Text>
                <Text className="text-xs text-gray-700 font-medium">
                  {formatDate(item.settlementPeriod.from)} -{" "}
                  {formatDate(item.settlementPeriod.to)}
                </Text>
              </View>
            )}

            {/* Footer: Generated By & Remarks */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="cog-outline" size={12} color="#9ca3af" />
                <Text className="ml-1 text-xs text-gray-400 capitalize">
                  {item.generatedBy || "system"}
                </Text>
              </View>

              {item.remarks && (
                <Text
                  className="text-xs text-gray-500 flex-1 ml-4"
                  numberOfLines={1}
                >
                  {item.remarks}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ================= RENDER EMPTY STATE =================
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <LinearGradient
        colors={["#fdf2f8", "#fce7f3"]}
        style={{ borderRadius: 100 }}
        className="p-6 mb-4"
      >
        <Ionicons name="wallet-outline" size={48} color="#db2777" />
      </LinearGradient>
      <Text className="text-gray-800 text-lg font-semibold mb-1">
        No Settlements Found
      </Text>
      <Text className="text-gray-500 text-sm text-center px-8">
        {selectedFilter
          ? `No ${selectedFilter} settlements yet.`
          : "Your settlement history will appear here."}
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className="mt-4 px-6 py-2 bg-pink-600 rounded-full"
      >
        <Text className="text-white font-medium">Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  // ================= RENDER LOADING =================
  const renderLoading = () => (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#db2777" />
      <Text className="text-gray-500 mt-3">Loading settlements...</Text>
    </View>
  );

  // ================= RENDER ERROR =================
  const renderError = () => (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
      <Text className="text-gray-800 text-lg font-semibold mt-4 mb-1">
        Something went wrong
      </Text>
      <Text className="text-gray-500 text-sm text-center mb-4">{error}</Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className="px-6 py-2 bg-pink-600 rounded-full"
      >
        <Text className="text-white font-medium">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // ================= RENDER FOOTER =================
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#db2777" />
        <Text className="text-gray-500 text-xs mt-1">Loading more...</Text>
      </View>
    );
  };

  // ================= RENDER FILTER ITEM =================
  const renderFilterItem = ({ item }: { item: (typeof FILTER_OPTIONS)[0] }) => (
    <TouchableOpacity
      onPress={() => handleFilterChange(item.value)}
      className="mr-2"
    >
      <LinearGradient
        colors={
          selectedFilter === item.value
            ? ["#db2777", "#be185d"]
            : ["#f3f4f6", "#e5e7eb"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20 }}
      >
        <View className="px-4 py-2">
          <Text
            className={`text-sm font-medium ${
              selectedFilter === item.value ? "text-white" : "text-gray-700"
            }`}
          >
            {item.label}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // ================= MAIN RENDER =================
  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-bold text-black">Settlements</Text>

          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        {pagination && pagination.totalRecords > 0 && (
          <View className="mx-4 mt-4">
            <LinearGradient
              colors={["#db2777", "#be185d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16 }}
              className="shadow-lg"
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/70 text-xs mb-1">
                      Total Records
                    </Text>
                    <Text className="text-white text-2xl font-bold">
                      {pagination.totalRecords}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/70 text-xs mb-1">
                      Page {pagination.page} of {pagination.totalPages}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="document-text" size={20} color="#fff" />
                      <Text className="text-white text-sm ml-1">
                        {settlements.length} loaded
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Filter Tabs */}
        <View className="mt-4 mb-2">
          <FlatList
            data={FILTER_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            keyExtractor={(item) => item.value || "all"}
            renderItem={renderFilterItem}
          />
        </View>

        {/* Content */}
        {isLoading && !isRefreshing ? (
          renderLoading()
        ) : error && settlements.length === 0 ? (
          renderError()
        ) : (
          <FlatList
            data={settlements}
            keyExtractor={(item) => item._id}
            renderItem={renderSettlementCard}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 20,
              flexGrow: 1,
            }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#db2777"]}
                tintColor="#db2777"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer Version */}
        <View className="items-center py-3 border-t border-gray-100">
          <Text className="text-pink-600 text-xs">Colio.V-1.0.0</Text>
        </View>
      </View>
    </GradientBackground>
  );
}
