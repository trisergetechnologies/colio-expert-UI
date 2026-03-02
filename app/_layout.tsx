// app/_layout.tsx (Consultant App)
import { ThemedText } from "@/components/ThemedText";
import { AuthProvider } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getToken } from "@/utils/tokenHelper";
import { Pacifico_400Regular, useFonts } from "@expo-google-fonts/pacifico";
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

const API_BASE_URL = 'https://api.colio.in/api';

// ============================================================================
// GLOBAL STATE
// ============================================================================
const activeRingingSessions = new Map<string, NodeJS.Timeout>();
const activeForegroundServiceStops = new Map<string, () => void>();
const activeIncomingNavigationSessions = new Set<string>();

// ============================================================================
// ✅ REGISTER FOREGROUND SERVICE — must be called at module level (not inside
// a component or useEffect) so it's registered before any notification fires.
// This runs in both dev and production builds, unlike index.js which is
// ignored by the Expo dev client.
// ============================================================================
notifee.registerForegroundService((notification) => {
  return new Promise<void>((resolve) => {
    const sessionId = String(notification.data?.sessionId || '');
    const customerName = String(notification.data?.customerName || '');
    console.log('[ForegroundService] 🔔 Started for sessionId:', sessionId);
    // Runtime evidence showed getDisplayedNotifications can briefly return empty
    // on lock screen/full-screen transitions, causing false early stop.
    // Keep service alive until explicit cancel/answer, with timeout as safety.
    let stopped = false;
    let backgroundPollInterval: NodeJS.Timeout | null = null;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (backgroundPollInterval) {
        clearInterval(backgroundPollInterval);
        backgroundPollInterval = null;
      }
      if (sessionId && activeForegroundServiceStops.get(sessionId) === stop) {
        activeForegroundServiceStops.delete(sessionId);
      }
      resolve();
    };

    if (sessionId) {
      activeForegroundServiceStops.set(sessionId, stop);

      // While screen is off/background, this is the reliable fallback path
      // to convert incoming-call -> missed-call when session is no longer ringing.
      backgroundPollInterval = setInterval(async () => {
        try {
          const token = await getToken();
          if (!token) {
            return;
          }
          const response = await axios.get(
            `${API_BASE_URL}/session/${sessionId}/status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const status = String(response.data?.data?.status || '');
          if (status && !['ringing', 'initiated', 'requested'].includes(status)) {
            await cancelIncomingCallNotification(sessionId);
            if (['cancelled', 'ended', 'missed', 'failed'].includes(status)) {
              await displayMissedCallNotification(sessionId, customerName);
            }
            stop();
          }
        } catch (err: any) {
          if (err?.response?.status === 404) {
            await cancelIncomingCallNotification(sessionId);
            await displayMissedCallNotification(sessionId, customerName);
            stop();
          }
        }
      }, 3000);
    }

    setTimeout(() => {
      console.log('[ForegroundService] ⏰ Timeout — stopping service');
      stop();
    }, 60000);
  });
});

// ============================================================================
// HELPER: Cancel notification + stop foreground service
// ============================================================================
async function cancelIncomingCallNotification(sessionId: string) {
  activeIncomingNavigationSessions.delete(sessionId);
  const stopForeground = activeForegroundServiceStops.get(sessionId);
  if (stopForeground) {
    console.log('[ForegroundService] 🛑 Explicit stop requested for sessionId:', sessionId);
    stopForeground();
  }

  // Stop the foreground service first
  try {
    await notifee.stopForegroundService();
  } catch (e) {
    // May not be running, that's fine
  }

  await notifee.cancelNotification(sessionId);

  try {
    const displayed = await notifee.getDisplayedNotifications();
    for (const n of displayed) {
      const data = n.notification?.data as Record<string, any> | undefined;
      const notifSessionId = String(data?.sessionId || '');
      if (
        n.id === sessionId ||
        n.id === String(sessionId) ||
        notifSessionId === sessionId ||
        notifSessionId === String(sessionId)
      ) {
        await notifee.cancelNotification(n.id!);
      }
    }
  } catch (err) {
    console.error('[Consultant] ❌ Error scanning notifications:', err);
  }
}

// ============================================================================
// HELPER: Show Missed Call Notification
// ============================================================================
async function displayMissedCallNotification(sessionId: string, callerName?: string) {
  const channelId = await notifee.createChannel({
    id: 'missed-calls',
    name: 'Missed Calls',
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    id: `missed_${sessionId}`,
    title: '📵 Missed Call',
    body: callerName ? `You missed a call from ${callerName}` : 'You missed a call from a customer.',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      autoCancel: true,
      pressAction: { id: 'default' },
    },
  });
}

// ============================================================================
// HELPER: Handle call cancelled
// ============================================================================
async function handleCallCancelled(data: Record<string, any>) {
  const sessionId = String(data.sessionId || '');
  if (!sessionId) return;
  if (activeRingingSessions.has(sessionId)) {
    clearInterval(activeRingingSessions.get(sessionId)!);
    activeRingingSessions.delete(sessionId);
  }
  await cancelIncomingCallNotification(sessionId);
  await displayMissedCallNotification(sessionId, String(data.customerName || ''));
}

// ============================================================================
// HELPER: Display incoming call notification WITH foreground service
//
// KEY FIX: Using a Foreground Service keeps the process alive and the
// notification persistent even when the screen is off or the system
// tries to kill background processes. This is what maintains the
// ringtone and vibration when the phone screen is locked.
// ============================================================================
async function displayIncomingCallNotification(data: Record<string, any>) {
  const sessionId = String(data.sessionId || '');
  console.log('[Consultant] 📞 Displaying incoming call notification with foreground service:', sessionId);

  const channelId = await notifee.createChannel({
    id: 'incoming-calls-v2',
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    sound: 'ringtone',
    vibration: true,
    vibrationPattern: [300, 500],
    visibility: AndroidVisibility.PUBLIC, // Show on lock screen
  });

  await notifee.displayNotification({
    id: sessionId,
    title: `📞 Incoming ${data.callType || 'Call'}`,
    body: `${data.customerName || 'Customer'} is calling you...`,
    data: data,
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      ongoing: true,         // Cannot be dismissed by swipe
      loopSound: true,       // Keep ringing
      autoCancel: false,
      sound: 'ringtone',
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: '❌ Decline', pressAction: { id: 'decline' } },
        { title: '✅ Answer', pressAction: { id: 'answer', launchActivity: 'default' } },
      ],
      // ✅ KEY: Foreground service keeps process alive with screen off
      // Without this, Android suspends the app and kills sound/vibration
      // after a few seconds when the screen turns off.
      asForegroundService: true,
      visibility: AndroidVisibility.PUBLIC, // Show full content on lock screen
      showTimestamp: true,
    },
  });
  console.log('[Consultant] ✅ Notification + foreground service started for:', sessionId);
  startSessionStatusPolling(sessionId, String(data.customerName || ''));
}

// ============================================================================
// Poll session status
// ============================================================================
function startSessionStatusPolling(sessionId: string, customerName: string) {
  if (activeRingingSessions.has(sessionId)) return;
  const pollInterval = setInterval(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const status = response.data?.data?.status;
      if (status && !['ringing', 'initiated', 'requested'].includes(status)) {
        clearInterval(activeRingingSessions.get(sessionId)!);
        activeRingingSessions.delete(sessionId);
        await cancelIncomingCallNotification(sessionId);
        if (['cancelled', 'ended', 'missed'].includes(status)) {
          await displayMissedCallNotification(sessionId, customerName);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        clearInterval(activeRingingSessions.get(sessionId)!);
        activeRingingSessions.delete(sessionId);
        await cancelIncomingCallNotification(sessionId);
        await displayMissedCallNotification(sessionId, customerName);
      }
    }
  }, 3000);
  activeRingingSessions.set(sessionId, pollInterval);
  setTimeout(() => {
    if (activeRingingSessions.has(sessionId)) {
      clearInterval(activeRingingSessions.get(sessionId)!);
      activeRingingSessions.delete(sessionId);
    }
  }, 60000);
}

// ============================================================================
// ROOT-LEVEL NOTIFEE BACKGROUND EVENT HANDLER
// ============================================================================
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    const sessionId = detail.notification?.id;
    if (detail.pressAction?.id === 'decline' && sessionId) {
      await cancelIncomingCallNotification(sessionId);
      if (activeRingingSessions.has(sessionId)) {
        clearInterval(activeRingingSessions.get(sessionId)!);
        activeRingingSessions.delete(sessionId);
      }
    }
  }
});

// ============================================================================
// ROOT-LEVEL FIREBASE BACKGROUND HANDLER
// ============================================================================
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (remoteMessage.data?.type === 'incoming_call') {
    await displayIncomingCallNotification(remoteMessage.data as Record<string, any>);
  }
  if (remoteMessage.data?.type === 'call_cancelled') {
    await handleCallCancelled(remoteMessage.data as Record<string, any>);
  }
});

// ============================================================================
// ROOT LAYOUT
// ============================================================================
export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
  const {} = useThemeColors();
  const isMounted = useRef(false);
  const hasHandledInitial = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const navigateToIncomingCall = (
    data: Record<string, any>,
    source: 'initial' | 'appstate' | 'foregroundEvent' | 'foregroundFCM'
  ) => {
    const sessionId = String(data.sessionId || '');
    if (!sessionId || !isMounted.current) return;
    if (activeIncomingNavigationSessions.has(sessionId)) {
      return;
    }
    activeIncomingNavigationSessions.add(sessionId);
    if (activeRingingSessions.has(sessionId)) {
      clearInterval(activeRingingSessions.get(sessionId)!);
      activeRingingSessions.delete(sessionId);
    }
    console.log('[Consultant] 🚀 Navigating to incoming-call:', sessionId);
    router.push({
      pathname: '/incoming-call',
      params: {
        sessionId,
        callType: String(data.callType || ''),
        customerName: String(data.customerName || ''),
        customerAvatar: String(data.customerAvatar || ''),
      },
    });
  };

  const validateAndNavigateIfRinging = async (
    data: Record<string, any>,
    source: 'initial' | 'appstate' | 'foregroundEvent' | 'foregroundFCM'
  ) => {
    const sessionId = String(data.sessionId || '');
    if (!sessionId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const status = String(response.data?.data?.status || '');
      if (['ringing', 'initiated', 'requested'].includes(status)) {
        navigateToIncomingCall(data, source);
      } else {
        await cancelIncomingCallNotification(sessionId);
        if (['cancelled', 'ended', 'missed', 'failed'].includes(status)) {
          await displayMissedCallNotification(sessionId, String(data.customerName || ''));
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await cancelIncomingCallNotification(sessionId);
        await displayMissedCallNotification(sessionId, String(data.customerName || ''));
      }
    }
  };

  const checkDisplayedNotificationsForCall = async () => {
    try {
      const displayed = await notifee.getDisplayedNotifications();
      console.log('[Consultant] 🔍 Checking displayed notifications on foreground:', displayed.length);
      for (const n of displayed) {
        const data = n.notification?.data as Record<string, any> | undefined;
        if (data?.type === 'incoming_call') {
          const sessionId = String(data.sessionId || '');
          console.log('[Consultant] 📞 Found ringing notification, sessionId:', sessionId);
          try {
            const token = await getToken();
            if (!token) return;
            const response = await axios.get(
              `${API_BASE_URL}/session/${sessionId}/status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const status = response.data?.data?.status;
            console.log('[Consultant] 📊 Call status:', status);
            if (['ringing', 'initiated', 'requested'].includes(status)) {
              await validateAndNavigateIfRinging(data, 'appstate');
            } else {
              await cancelIncomingCallNotification(sessionId);
              if (['cancelled', 'ended', 'missed', 'failed'].includes(String(status || ''))) {
                await displayMissedCallNotification(
                  sessionId,
                  String(data.customerName || '')
                );
              }
            }
          } catch (e) {
            await cancelIncomingCallNotification(sessionId);
          }
          return;
        }
      }
    } catch (e) {
      console.error('[Consultant] ❌ Error checking displayed notifications:', e);
    }
  };

  useEffect(() => {
    if (!fontsLoaded) return;
    console.log('[Consultant] App started');

    // --- LISTENER 1: KILLED STATE ---
    if (!hasHandledInitial.current) {
      hasHandledInitial.current = true;
      notifee.getInitialNotification().then(initialNotification => {
        if (initialNotification?.notification?.data) {
          const data = initialNotification.notification.data as Record<string, any>;
          const actionId = initialNotification.pressAction?.id;
          console.log('[Consultant] 🥶 App opened from KILLED state, type:', data.type);
          if (data.type === 'incoming_call' && actionId !== 'decline') {
            validateAndNavigateIfRinging(data, 'initial');
          }
        }
      });
    }

    // --- LISTENER 2: BACKGROUND → FOREGROUND (screen was off / app in RAM) ---
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      appState.current = nextAppState;
      console.log('[Consultant] 📱 AppState:', previousState, '->', nextAppState);
      if (
        (previousState === 'background' || previousState === 'inactive') &&
        nextAppState === 'active'
      ) {
        console.log('[Consultant] 📱 App foregrounded — checking for pending calls');
        checkDisplayedNotificationsForCall();
      }
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // --- LISTENER 3: NOTIFEE FOREGROUND (tap/button while app is open) ---
    const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
      const data = detail.notification?.data as Record<string, any> | undefined;
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        if (data?.type === 'incoming_call') {
          if (detail.pressAction?.id === 'decline') {
            const sessionId = String(data.sessionId || '');
            cancelIncomingCallNotification(sessionId);
            if (activeRingingSessions.has(sessionId)) {
              clearInterval(activeRingingSessions.get(sessionId)!);
              activeRingingSessions.delete(sessionId);
            }
            return;
          }
          await validateAndNavigateIfRinging(data, 'foregroundEvent');
        }
      }
    });

    // --- LISTENER 4: FCM FOREGROUND (app fully open) ---
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      console.log('[Consultant] 📩 Foreground FCM type:', remoteMessage.data?.type);
      if (remoteMessage.data?.type === 'incoming_call') {
        const data = remoteMessage.data as Record<string, any>;
        console.log('[Consultant] 📞 Call while app open — navigating directly');
        await validateAndNavigateIfRinging(data, 'foregroundFCM');
        startSessionStatusPolling(String(data.sessionId || ''), String(data.customerName || ''));
      }
      if (remoteMessage.data?.type === 'call_cancelled') {
        await handleCallCancelled(remoteMessage.data as Record<string, any>);
      }
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeForeground();
      unsubscribeFCM();
    };
  }, [fontsLoaded, router]);

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
        <CallProvider>
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