import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal Imports
import { getToken } from "@/utils/tokenHelper";

const API_BASE_URL = "https://api.colio.in/api";

// --- Types ---
type PerformanceData = {
  profile: {
    name: string;
    avatar: string;
    availabilityStatus: "onWork" | "offWork" | "busy";
    ratingAverage: number;
  };
  earnings: {
    today: number;
    week: number;
    month: number;
    wallet: number;
  };
  requestTrend: {
    label: string;
    value: number;
  }[];
};

// --- Components ---

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <View 
    style={[
      {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: "#E0C3FC",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
      style
    ]}
  >
    {children}
  </View>
);

const StatPill = ({ label, value, icon, trend }: any) => (
  <View className="bg-white p-4 rounded-2xl mr-3 w-[140px] border border-gray-50 shadow-sm">
    <View className="flex-row justify-between items-start mb-2">
      <View className="bg-orange-50 p-2 rounded-full">
        {icon}
      </View>
      {trend && <Text className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">{trend}</Text>}
    </View>
    <Text className="text-gray-400 text-xs font-medium mb-1">{label}</Text>
    <Text className="text-gray-900 text-xl font-bold">{value}</Text>
  </View>
);

const AnimatedBar = ({ value, max, label }: any) => {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming((value / (max || 1)) * 100, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, [value, max]);

  const style = useAnimatedStyle(() => ({ height: `${height.value}%` }));

  return (
    <View className="items-center h-[140px] justify-end w-8 mx-1">
      <View className="w-2 h-full bg-gray-100 rounded-full absolute bottom-5 overflow-hidden">
         <Animated.View style={[style, { backgroundColor: '#FF8A65', borderRadius: 10, width: '100%', position: 'absolute', bottom: 0 }]} />
      </View>
      <Text className="text-[10px] text-gray-400 font-medium mt-2">{label}</Text>
    </View>
  );
};

// --- Main Screen ---

export default function PerformanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);

  const fetchPerformance = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/consultant/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) setData(response.data.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPerformance(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPerformance(); };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const maxTrend = useMemo(() => Math.max(...(data?.requestTrend?.map(t => t.value) || [10])), [data]);

  // NOTE: Your current API response (PerformanceData type) ONLY returns 'requestTrend'.
  // It does NOT return 'completed' vs 'missed' counts. 
  // Ideally, you should ask backend to send { totalRequests, completedRequests, missedRequests }.
  // For now, I have removed the hardcoded 85%/15% section to avoid fake data.

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-[#FDFBF7]">
      <ActivityIndicator size="large" color="#FF8A65" />
    </View>
  );

  return (
    <View className="flex-1 bg-[#FDFBF7]">
      <StatusBar barStyle="dark-content" />
      
      {/* --- Top Gradient Header --- */}
      <View style={{ height: 280 }} className="absolute w-full rounded-b-[40px] overflow-hidden">
        <LinearGradient
          colors={['#FFEEE4', '#FDFBF7']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View className="absolute -top-20 -right-20 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />
        <View className="absolute top-10 -left-10 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8A65" />}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Navbar --- */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Performance</Text>
          <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="notifications-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* --- Profile Section --- */}
        <View className="px-6 mt-2 mb-6">
          <View className="flex-row items-center">
            <View className="relative">
              <Image 
                source={{ uri: data?.profile?.avatar || "https://i.pravatar.cc/150?img=32" }} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-sm"
              />
              <View className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white items-center justify-center ${data?.profile?.availabilityStatus === 'onWork' ? 'bg-green-500' : 'bg-gray-400'}`}>
                {data?.profile?.availabilityStatus === 'onWork' && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-gray-900">{data?.profile?.name}</Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-orange-100 px-2 py-0.5 rounded-md flex-row items-center">
                   <Ionicons name="star" size={12} color="#F59E0B" />
                   <Text className="text-xs font-bold text-orange-700 ml-1">{data?.profile?.ratingAverage?.toFixed(1) || "New"}</Text>
                </View>
                <Text className="text-gray-400 text-xs ml-2">Verified Expert</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Earnings Slider --- */}
        <View className="mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            <StatPill 
              label="Today" 
              value={formatCurrency(data?.earnings?.today || 0)} 
              icon={<Ionicons name="sunny-outline" size={20} color="#F97316" />}
              trend="+12%"
            />
            <StatPill 
              label="This Week" 
              value={formatCurrency(data?.earnings?.week || 0)} 
              icon={<Ionicons name="calendar-outline" size={20} color="#8B5CF6" />}
            />
            <StatPill 
              label="Wallet" 
              value={formatCurrency(data?.earnings?.wallet || 0)} 
              icon={<Ionicons name="wallet-outline" size={20} color="#10B981" />}
            />
          </ScrollView>
        </View>

        {/* --- Main Dashboard Card --- */}
        <View className="px-6">
          <GlassCard style={{ padding: 20, marginBottom: 24 }}>
             <View className="flex-row justify-between items-center mb-6">
                <View>
                   <Text className="text-lg font-bold text-gray-800">Session Activity</Text>
                   <Text className="text-xs text-gray-400">Weekly Overview</Text>
                </View>
                <TouchableOpacity className="bg-orange-50 px-3 py-1.5 rounded-full">
                   <Text className="text-orange-600 text-xs font-bold">See Report</Text>
                </TouchableOpacity>
             </View>
             
             {/* Chart */}
             <View className="flex-row justify-between items-end h-[160px] pb-2">
                {data?.requestTrend?.map((item, i) => (
                   <AnimatedBar key={i} value={item.value} max={maxTrend} label={item.label} />
                ))}
             </View>
             
             {/* REMOVED: The "85% Completed / 15% Missed" section.
                 REASON: Your current API response (PerformanceData) does NOT provide these numbers.
                 It was hardcoded text. If you want this back, your backend needs to send:
                 { totalRequests: 100, completed: 85, missed: 15 } inside the API response.
             */}
          </GlassCard>
        </View>

      </ScrollView>
    </View>
  );
}