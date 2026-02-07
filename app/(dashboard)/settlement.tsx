// app/(dashboard)/settlement.tsx  (PRODUCTION SAFE — NO NATIVEWIND)

import GradientBackground from "@/components/Gradientbackground";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";
const { width } = Dimensions.get("window");

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
    bgColor: "rgba(245,158,11,0.2)",
    borderColor: "rgba(245,158,11,0.3)",
    icon: "time-outline",
    label: "Pending",
  },
  approved: {
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.2)",
    borderColor: "rgba(59,130,246,0.3)",
    icon: "checkmark-circle-outline",
    label: "Approved",
  },
  settled: {
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.2)",
    borderColor: "rgba(34,197,94,0.3)",
    icon: "checkmark-done-circle-outline",
    label: "Settled",
  },
  rejected: {
    color: "#ef4444",
    bgColor: "rgba(239,68,68,0.2)",
    borderColor: "rgba(239,68,68,0.3)",
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

  useEffect(() => {
    setCurrentPage(1);
    setSettlements([]);
    fetchSettlements(1, false, selectedFilter);
  }, [selectedFilter]);

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
      <TouchableOpacity activeOpacity={0.8} style={styles.cardWrapper}>
        <LinearGradient
          colors={["#ffffff", "#fefefe"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.amountText}>
                  {formatAmount(item.amount, item.currency)}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusConfig.bgColor,
                    borderColor: statusConfig.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name={statusConfig.icon}
                  size={14}
                  color={statusConfig.color}
                />
                <Text
                  style={[
                    styles.statusLabel,
                    { color: statusConfig.color },
                  ]}
                >
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bankSection}>
              <View style={styles.bankRow}>
                <Ionicons name="business-outline" size={16} color="#6b7280" />
                <Text style={styles.bankName}>
                  {item.bankSnapshot?.bankName || "Bank Name N/A"}
                </Text>
              </View>

              <View style={styles.accountRow}>
                <View style={styles.accountLeft}>
                  <Ionicons name="card-outline" size={16} color="#6b7280" />
                  <Text style={styles.accountText}>
                    A/C: {maskAccountNumber(item.bankSnapshot?.accountNumber)}
                  </Text>
                </View>
                <Text style={styles.ifscText}>
                  IFSC: {item.bankSnapshot?.ifscCode || "N/A"}
                </Text>
              </View>

              {item.bankSnapshot?.upiId && (
                <View style={styles.upiRow}>
                  <Ionicons name="qr-code-outline" size={16} color="#6b7280" />
                  <Text style={styles.upiText}>
                    UPI: {item.bankSnapshot.upiId}
                  </Text>
                </View>
              )}
            </View>

            {item.utr && (
              <View style={styles.utrBox}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.utrText}>UTR: {item.utr}</Text>
              </View>
            )}

            {item.status === "rejected" && item.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#ef4444"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.rejectionText}>
                  {item.rejectionReason}
                </Text>
              </View>
            )}

            {item.settlementPeriod?.from && item.settlementPeriod?.to && (
              <View style={styles.periodBox}>
                <Text style={styles.periodLabel}>Settlement Period</Text>
                <Text style={styles.periodValue}>
                  {formatDate(item.settlementPeriod.from)} -{" "}
                  {formatDate(item.settlementPeriod.to)}
                </Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <View style={styles.generatedByRow}>
                <Ionicons name="cog-outline" size={12} color="#9ca3af" />
                <Text style={styles.generatedByText}>
                  {item.generatedBy || "system"}
                </Text>
              </View>

              {item.remarks && (
                <Text style={styles.remarksText} numberOfLines={1}>
                  {item.remarks}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ================= MAIN RENDER =================
  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settlements</Text>

          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        {pagination && pagination.totalRecords > 0 && (
          <View style={styles.summaryWrapper}>
            <LinearGradient
              colors={["#db2777", "#be185d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View style={styles.summaryContent}>
                <View>
                  <Text style={styles.summaryLabel}>Total Records</Text>
                  <Text style={styles.summaryValue}>
                    {pagination.totalRecords}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.summaryLabel}>
                    Page {pagination.page} of {pagination.totalPages}
                  </Text>
                  <View style={styles.summaryRow}>
                    <Ionicons name="document-text" size={20} color="#fff" />
                    <Text style={styles.summaryLoaded}>
                      {settlements.length} loaded
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Filters */}
        <View style={{ marginVertical: 8 }}>
          <FlatList
            data={FILTER_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            keyExtractor={(item) => item.value || "all"}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleFilterChange(item.value)}
                style={{ marginRight: 8 }}
              >
                <LinearGradient
                  colors={
                    selectedFilter === item.value
                      ? ["#db2777", "#be185d"]
                      : ["#f3f4f6", "#e5e7eb"]
                  }
                  style={styles.filterButton}
                >
                  <Text
                    style={
                      selectedFilter === item.value
                        ? styles.filterTextActive
                        : styles.filterText
                    }
                  >
                    {item.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#db2777" />
            <Text style={styles.loadingText}>Loading settlements...</Text>
          </View>
        ) : error && settlements.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
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
            ListEmptyComponent={
              <View style={styles.center}>
                <Text>No Settlements Found</Text>
              </View>
            }
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Colio.V-1.0.0</Text>
        </View>
      </View>
    </GradientBackground>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },

  cardWrapper: { marginHorizontal: 16, marginBottom: 16 },
  cardGradient: { borderRadius: 16 },
  cardContent: { padding: 16 },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  amountText: { fontSize: 20, fontWeight: "700", color: "#111827" },
  dateText: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusLabel: { marginLeft: 6, fontSize: 12, fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },

  bankSection: { marginBottom: 8 },
  bankRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  bankName: { marginLeft: 8, fontSize: 14, color: "#374151" },

  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountLeft: { flexDirection: "row", alignItems: "center" },
  accountText: { marginLeft: 8, fontSize: 14, color: "#4b5563" },
  ifscText: { fontSize: 12, color: "#6b7280" },

  upiRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  upiText: { marginLeft: 8, fontSize: 14, color: "#4b5563" },

  utrBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  utrText: { marginLeft: 8, fontSize: 12, color: "#166534" },

  rejectionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectionText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#7f1d1d",
    flex: 1,
  },

  periodBox: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  periodLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  periodValue: { fontSize: 12, fontWeight: "600", color: "#374151" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  generatedByRow: { flexDirection: "row", alignItems: "center" },
  generatedByText: {
    marginLeft: 4,
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "capitalize",
  },
  remarksText: {
    fontSize: 10,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
  },

  summaryWrapper: { marginHorizontal: 16, marginTop: 12 },
  summaryCard: { borderRadius: 16 },
  summaryContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  summaryValue: { fontSize: 22, fontWeight: "700", color: "#fff" },
  summaryRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  summaryLoaded: { color: "#fff", marginLeft: 6, fontSize: 12 },

  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterText: { fontSize: 14, color: "#374151" },
  filterTextActive: { fontSize: 14, color: "#fff", fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#6b7280" },

  errorTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  errorText: { fontSize: 14, color: "#6b7280", marginVertical: 8 },

  retryButton: {
    backgroundColor: "#db2777",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  footer: {
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: { color: "#db2777", fontSize: 12 },
});
