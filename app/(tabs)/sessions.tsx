import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ================= TYPES =================
interface UserInfo {
  _id: string;
  name: string;
  avatar?: string;
  consultantProfile?: {
    ratePerMinute?: number;
  };
}

interface Session {
  sessionId: string;
  type: "chat" | "voice" | "video";
  status: "initiated" | "ringing" | "active" | "ended" | "cancelled" | "failed";
  customer: UserInfo;
  consultant: UserInfo;
  channelName: string | null;
  chatConversationId: string | null;
  ratePerMinute: number;
  totalDurationSeconds: number;
  billedAmount: number;
  isBilled: boolean;
  startedAt: string | null;
  endedAt: string | null;
  endedBy: string | null;
  autoEnded: boolean;
  networkQuality: "good" | "poor" | "unknown";
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalSessions: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ================= TABS CONFIG =================
const TABS = [
  { key: "all", label: "All", icon: "apps-outline" as const },
  { key: "voice", label: "Voice", icon: "call-outline" as const },
  { key: "video", label: "Video", icon: "videocam-outline" as const },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB_WIDTH = (SCREEN_WIDTH - 32) / TABS.length;

// ================= STATUS CONFIG =================
const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  initiated: {
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "hourglass-outline",
    label: "Initiated",
  },
  ringing: {
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    icon: "notifications-outline",
    label: "Ringing",
  },
  active: {
    color: "#22c55e",
    bgColor: "#dcfce7",
    icon: "pulse-outline",
    label: "Active",
  },
  ended: {
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "checkmark-circle-outline",
    label: "Ended",
  },
  cancelled: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "close-circle-outline",
    label: "Cancelled",
  },
  failed: {
    color: "#dc2626",
    bgColor: "#fee2e2",
    icon: "alert-circle-outline",
    label: "Failed",
  },
};

// ================= TYPE CONFIG =================
const TYPE_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  voice: { color: "#22c55e", bgColor: "#dcfce7", icon: "call", label: "Voice" },
  video: {
    color: "#db2777",
    bgColor: "#fce7f3",
    icon: "videocam",
    label: "Video",
  },
  chat: {
    color: "#3b82f6",
    bgColor: "#dbeafe",
    icon: "chatbubble",
    label: "Chat",
  },
};

export default function SessionsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // ================= STATE =================
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ================= REFS =================
  const isMounted = useRef(true);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const tabScaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ================= ANIMATE TAB =================
  const animateToTab = (index: number) => {
    // Animate indicator slide
    Animated.spring(tabIndicatorAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Bounce effect on active tab
    Animated.sequence([
      Animated.timing(tabScaleAnims[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(tabScaleAnims[index], {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 5,
      }),
    ]).start();
  };

  // ================= FETCH SESSIONS =================
  const fetchSessions = async (
    page: number = 1,
    append: boolean = false,
    type: TabKey = activeTab,
  ) => {
    if (!isMounted.current) return;

    if (page === 1 && !append) {
      setIsLoading(true);
    } else if (append) {
      setIsLoadingMore(true);
    }
    setError(null);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: "15",
    });

    // Add type filter - API expects lowercase
    if (type !== "all") {
      queryParams.append("type", type);
    }
    const token = await getToken();

    fetch(`${API_BASE_URL}/user/sessions?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted.current) return;

        if (data.success && data.data) {
          if (append) {
            setSessions((prev) => [...prev, ...data.data.sessions]);
          } else {
            setSessions(data.data.sessions);
          }
          setPagination(data.data.pagination);
          setCurrentPage(data.data.pagination.currentPage);
        } else {
          setError(data.message || "Failed to fetch sessions");
          if (!append) {
            setSessions([]);
          }
        }
      })
      .catch((err) => {
        console.error("Fetch sessions error:", err);
        if (isMounted.current) {
          setError("Network error. Please try again.");
          if (!append) {
            setSessions([]);
          }
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setIsRefreshing(false);
        }
      });
  };

  // ================= INITIAL FETCH =================
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1);
      setSessions([]);
      fetchSessions(1, false, activeTab);
    }
  }, [activeTab, isAuthenticated]);

  // ================= HANDLERS =================
  const handleTabPress = (tabKey: TabKey, index: number) => {
    if (tabKey === activeTab) return;
    animateToTab(index);
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSessions([]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchSessions(1, false, activeTab);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !isLoadingMore && !isLoading) {
      fetchSessions(currentPage + 1, true, activeTab);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // ================= GET OTHER PARTY =================
  const getOtherParty = (session: Session): UserInfo => {
    if (user?.userId === session.customer?._id) {
      return session.consultant;
    }
    return session.customer;
  };

  // ================= RENDER TAB BAR =================
  const renderTabBar = () => (
    <View className="mx-4 mt-4 mb-3">
      <View
        className="rounded-2xl p-1.5 flex-row relative overflow-hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
      >
        {/* Animated Sliding Indicator */}
        <Animated.View
          style={{
            position: "absolute",
            width: TAB_WIDTH - 6,
            height: "100%",
            top: 6,
            left: 3,
            transform: [{ translateX: tabIndicatorAnim }],
          }}
        >
          <LinearGradient
            colors={["#db2777", "#be185d", "#9d174d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 12,
              shadowColor: "#db2777",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
          />
        </Animated.View>

        {/* Tab Buttons */}
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key, index)}
              activeOpacity={0.8}
              style={{ width: TAB_WIDTH - 4, paddingVertical: 12 }}
              className="items-center justify-center z-10"
            >
              <Animated.View
                style={{
                  transform: [{ scale: tabScaleAnims[index] }],
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? "#fff" : "rgba(0,0,0,0.5)"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#fff" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ================= RENDER SESSION CARD =================
  const renderSessionCard = ({ item }: { item: Session }) => {
    const otherParty = getOtherParty(item);
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.ended;
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.voice;

    return (
      <TouchableOpacity activeOpacity={0.9} className="mx-4 mb-4">
        <View
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Card Header with Type Indicator */}
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ backgroundColor: typeConfig.bgColor }}
          >
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: typeConfig.color }}
              >
                <Ionicons name={typeConfig.icon} size={16} color="#fff" />
              </View>
              <View>
                <Text
                  className="font-bold text-sm"
                  style={{ color: typeConfig.color }}
                >
                  {typeConfig.label} Session
                </Text>
                <Text className="text-xs text-black/50">
                  {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center"
              style={{ backgroundColor: statusConfig.bgColor }}
            >
              <Ionicons
                name={statusConfig.icon}
                size={12}
                color={statusConfig.color}
              />
              <Text
                className="text-xs font-semibold ml-1"
                style={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* User Info Section */}
          <View className="px-4 py-4">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      otherParty?.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  className="w-14 h-14 rounded-2xl"
                  style={{ borderWidth: 2, borderColor: typeConfig.bgColor }}
                />
                {/* Network indicator dot */}
                <View
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-white"
                  style={{
                    backgroundColor: "#22c55e",
                  }}
                >
                  <Ionicons name="wifi" size={10} color="#fff" />
                </View>
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className="font-bold text-black text-base"
                  numberOfLines={1}
                >
                  {otherParty?.name || "Unknown User"}
                </Text>
                <Text className="text-black/50 text-sm mt-0.5">
                  Colio Connection
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View
            className="flex-row px-4 py-3 border-t"
            style={{ borderTopColor: "rgba(0,0,0,0.05)" }}
          >
            {/* Duration */}
            <View className="flex-1 flex-row items-center">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: "#fef3c7" }}
              >
                <Ionicons name="time-outline" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-xs text-black/40">Duration</Text>
                <Text className="font-bold text-sm text-black">
                  {formatDuration(item.totalDurationSeconds)}
                </Text>
              </View>
            </View>

            {/* Status Icon */}
            <View className="items-center justify-center">
              {item.autoEnded && (
                <View
                  className="flex-row items-center px-2 py-1 rounded-lg"
                  style={{ backgroundColor: "#fef3c7" }}
                >
                  <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                  <Text className="text-xs text-amber-600 ml-1 font-medium">
                    Auto
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Time Range Footer */}
          {item.startedAt && item.endedAt && (
            <View
              className="flex-row items-center justify-between px-4 py-2.5"
              style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
            >
              <View className="flex-row items-center">
                <Ionicons name="play-circle" size={14} color="#22c55e" />
                <Text className="text-xs text-black/50 ml-1">
                  {formatTime(item.startedAt)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-8 h-[1px] bg-black/10 mx-2" />
                <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
                <View className="w-8 h-[1px] bg-black/10 mx-2" />
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs text-black/50 mr-1">
                  {formatTime(item.endedAt)}
                </Text>
                <Ionicons name="stop-circle" size={14} color="#ef4444" />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ================= RENDER EMPTY STATE =================
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <LinearGradient
        colors={["#fdf2f8", "#fce7f3"]}
        style={{ borderRadius: 100 }}
        className="p-8 mb-5"
      >
        <Ionicons
          name={
            activeTab === "voice"
              ? "call-outline"
              : activeTab === "video"
                ? "videocam-outline"
                : "apps-outline"
          }
          size={56}
          color="#db2777"
        />
      </LinearGradient>
      <Text className="text-gray-800 text-xl font-bold mb-2">
        No Sessions Found
      </Text>
      <Text className="text-gray-500 text-sm text-center px-12 mb-6">
        {activeTab !== "all"
          ? `You don't have any ${activeTab} sessions yet.`
          : "Your session history will appear here once you start connecting."}
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className="px-8 py-3 rounded-full"
        style={{ backgroundColor: "#db2777" }}
      >
        <Text className="text-white font-semibold">Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  // ================= RENDER LOADING =================
  const renderLoading = () => (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#db2777" />
      <Text className="text-gray-500 mt-4 text-base">Loading sessions...</Text>
    </View>
  );

  // ================= RENDER ERROR =================
  const renderError = () => (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <View
        className="p-6 rounded-full mb-5"
        style={{ backgroundColor: "#fee2e2" }}
      >
        <Ionicons name="cloud-offline-outline" size={56} color="#ef4444" />
      </View>
      <Text className="text-gray-800 text-xl font-bold mb-2">
        Connection Error
      </Text>
      <Text className="text-gray-500 text-sm text-center mb-6">{error}</Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className="px-8 py-3 rounded-full"
        style={{ backgroundColor: "#db2777" }}
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // ================= RENDER FOOTER =================
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color="#db2777" />
        <Text className="text-gray-400 text-xs mt-2">Loading more...</Text>
      </View>
    );
  };

  // ================= MAIN RENDER =================
  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-black">Sessions</Text>

          <TouchableOpacity
            onPress={handleRefresh}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <Ionicons name="refresh-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        {pagination && pagination.totalSessions > 0 && (
          <View className="mx-4 mt-2">
            <LinearGradient
              colors={["#db2777", "#be185d", "#9d174d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                shadowColor: "#db2777",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <View className="p-5 flex-row items-center justify-between">
                <View>
                  <Text className="text-white/70 text-xs font-medium mb-1">
                    Total Sessions
                  </Text>
                  <Text className="text-white text-3xl font-bold">
                    {pagination.totalSessions}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/70 text-xs font-medium mb-1">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full mt-1">
                    <Ionicons name="list" size={14} color="#fff" />
                    <Text className="text-white text-sm font-semibold ml-1.5">
                      {sessions.length} loaded
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Tab Bar */}
        {renderTabBar()}

        {/* Content */}
        {isLoading && !isRefreshing ? (
          renderLoading()
        ) : error && sessions.length === 0 ? (
          renderError()
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.sessionId}
            renderItem={renderSessionCard}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 24,
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
      </View>
    </GradientBackground>
  );
}
