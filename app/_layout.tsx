// app/_layout.tsx (Consultant App)
import { ThemedText } from "@/components/ThemedText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { AuthProvider } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext"; // ✅ Add this
import { useIncomingCallPolling } from '@/hooks/useIncomingCallPolling';
// import { registerForPushNotificationsAsync } from '@/utils/notificationHelper';
import {
  Pacifico_400Regular,
  useFonts,
} from "@expo-google-fonts/pacifico";
import * as Notifications from 'expo-notifications';
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const {} = useThemeColors();
  
  const { startPolling, stopPolling } = useIncomingCallPolling();

  useEffect(() => {
    if (!fontsLoaded) return;

    console.log('[Consultant] App started');
    
    // registerForPushNotificationsAsync();
    // startPolling();

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Consultant] 📱 Push notification received');
        const data = notification.request.content.data as Record<string, any>;
        
        if (data.type === 'incoming_call') {
          router.push({
            pathname: '/incoming-call',
            params: {
              sessionId: String(data.sessionId || ''),
              callType: String(data.callType || ''),
              customerName: String(data.customerName || ''),
              customerAvatar: String(data.customerAvatar || ''),
            },
          });
        }
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[Consultant] 📱 Push notification tapped');
        const data = response.notification.request.content.data as Record<string, any>;
        
        if (data.type === 'incoming_call') {
          router.push({
            pathname: '/incoming-call',
            params: {
              sessionId: String(data.sessionId || ''),
              callType: String(data.callType || ''),
              customerName: String(data.customerName || ''),
              customerAvatar: String(data.customerAvatar || ''),
            },
          });
        }
      }
    );

    return () => {
      // stopPolling();
      notificationListener.remove();
      responseListener.remove();
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CallProvider> {/* ✅ Wrap with CallProvider */}
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
          </View>
        </CallProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}