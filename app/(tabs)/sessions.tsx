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

/* ================ TYPES (UNCHANGED) ================ */
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

/* ================ TABS ================ */
const TABS = [
  { key: "all", label: "All", icon: "apps-outline" as const },
  { key: "voice", label: "Voice", icon: "call-outline" as const },
  { key: "video", label: "Video", icon: "videocam-outline" as const },
] as const;

type TabKey = (typeof TABS)[number]["key"];
const TAB_WIDTH = (SCREEN_WIDTH - 32) / TABS.length;

/* ================ STATUS CONFIG ================ */
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

/* ================ TYPE CONFIG ================ */
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

  /* ================ STATE ================ */
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ================ REFS ================ */
  const isMounted = useRef(true);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const tabScaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ================ ANIMATE TAB ================ */
  const animateToTab = (index: number) => {
    Animated.spring(tabIndicatorAnim, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

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

  /* ================ FETCH SESSIONS ================ */
  const fetchSessions = async (
    page: number = 1,
    append: boolean = false,
    type: TabKey = activeTab,
  ) => {
    if (!isMounted.current) return;

    if (page === 1 && !append) setIsLoading(true);
    else if (append) setIsLoadingMore(true);

    setError(null);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: "15",
    });

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
          if (!append) setSessions([]);
        }
      })
      .catch((err) => {
        console.error("Fetch sessions error:", err);
        if (isMounted.current) {
          setError("Network error. Please try again.");
          if (!append) setSessions([]);
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

  /* ================ INITIAL FETCH ================ */
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1);
      setSessions([]);
      fetchSessions(1, false, activeTab);
    }
  }, [activeTab, isAuthenticated]);

  /* ================ HANDLERS ================ */
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

  /* ================ FORMAT HELPERS ================ */
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

  const getOtherParty = (session: Session): UserInfo => {
    if (user?.userId === session.customer?._id) {
      return session.consultant;
    }
    return session.customer;
  };

  /* ================ RENDER TAB BAR ================ */
  const renderTabBar = () => (
    <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12 }}>
      <View
        style={{
          borderRadius: 16,
          padding: 6,
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "rgba(0,0,0,0.06)",
        }}
      >
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

        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key, index)}
              activeOpacity={0.8}
              style={{
                width: TAB_WIDTH - 4,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
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

  /* ================ RENDER SESSION CARD ================ */
  const renderSessionCard = ({ item }: { item: Session }) => {
    const otherParty = getOtherParty(item);
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.ended;
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.voice;

    return (
      <TouchableOpacity activeOpacity={0.9} style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: typeConfig.bgColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  backgroundColor: typeConfig.color,
                }}
              >
                <Ionicons name={typeConfig.icon} size={16} color="#fff" />
              </View>
              <View>
                <Text style={{ fontWeight: "700", fontSize: 14, color: typeConfig.color }}>
                  {typeConfig.label} Session
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.5)" }}>
                  {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>

            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: statusConfig.bgColor,
              }}
            >
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  marginLeft: 4,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* USER INFO */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{
                    uri:
                      otherParty?.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: typeConfig.bgColor,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#fff",
                    backgroundColor: "#22c55e",
                  }}
                >
                  <Ionicons name="wifi" size={10} color="#fff" />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: "700", fontSize: 16, color: "#000" }} numberOfLines={1}>
                  {otherParty?.name || "Unknown User"}
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
                  Colio Connection
                </Text>
              </View>
            </View>
          </View>

          {/* STATS ROW */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: "rgba(0,0,0,0.05)",
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  backgroundColor: "#fef3c7",
                }}
              >
                <Ionicons name="time-outline" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>Duration</Text>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#000" }}>
                  {formatDuration(item.totalDurationSeconds)}
                </Text>
              </View>
            </View>

            {item.autoEnded && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: "#fef3c7",
                }}
              >
                <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                <Text style={{ fontSize: 12, color: "#d97706", marginLeft: 4, fontWeight: "500" }}>
                  Auto
                </Text>
              </View>
            )}
          </View>

          {/* FOOTER TIME RANGE */}
          {item.startedAt && item.endedAt && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="play-circle" size={14} color="#22c55e" />
                <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginLeft: 4 }}>
                  {formatTime(item.startedAt)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 32, height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />
                <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
                <View style={{ width: 32, height: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", marginRight: 4 }}>
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

  /* ================ EMPTY STATE ================ */
  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
      <LinearGradient
        colors={["#fdf2f8", "#fce7f3"]}
        style={{ borderRadius: 100, padding: 32, marginBottom: 20 }}
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

      <Text style={{ color: "#1f2937", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
        No Sessions Found
      </Text>

      <Text
        style={{
          color: "#6b7280",
          fontSize: 14,
          textAlign: "center",
          paddingHorizontal: 48,
          marginBottom: 24,
        }}
      >
        {activeTab !== "all"
          ? `You don't have any ${activeTab} sessions yet.`
          : "Your session history will appear here once you start connecting."}
      </Text>

      <TouchableOpacity
        onPress={handleRefresh}
        style={{
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 999,
          backgroundColor: "#db2777",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  /* ================ LOADING ================ */
  const renderLoading = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
      <ActivityIndicator size="large" color="#db2777" />
      <Text style={{ color: "#6b7280", marginTop: 16, fontSize: 16 }}>Loading sessions...</Text>
    </View>
  );

  /* ================ ERROR ================ */
  const renderError = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
      <View
        style={{
          padding: 24,
          borderRadius: 999,
          backgroundColor: "#fee2e2",
          marginBottom: 20,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={56} color="#ef4444" />
      </View>

      <Text style={{ color: "#1f2937", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
        Connection Error
      </Text>

      <Text style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
        {error}
      </Text>

      <TouchableOpacity
        onPress={handleRefresh}
        style={{
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 999,
          backgroundColor: "#db2777",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  /* ================ FOOTER ================ */
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <ActivityIndicator size="small" color="#db2777" />
        <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>Loading more...</Text>
      </View>
    );
  };

  /* ================ MAIN RENDER ================ */
  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* HEADER */}
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
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>Sessions</Text>

          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* SUMMARY CARD */}
        {pagination && pagination.totalSessions > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 8 }}>
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
              <View
                style={{
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 }}>
                    Total Sessions
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
                    {pagination.totalSessions}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Ionicons name="list" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 6 }}>
                      {sessions.length} loaded
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* TAB BAR */}
        {renderTabBar()}

        {/* CONTENT */}
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
