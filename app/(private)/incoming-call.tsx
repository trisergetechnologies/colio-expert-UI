// app/incoming-call.tsx  (FULL FILE — replace yours)

import { useCallContext } from "@/context/CallContext";
import { clearEngine, createEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Easing,
  Image,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";

const API_BASE_URL = "https://api.colio.in/api";
const AGORA_APP_ID = "8b9ed38f29bb4b1bbc7958f5fda8b054";

const { width, height } = Dimensions.get('window');

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const { startCall } = useCallContext();

  const sessionId = params.sessionId as string;
  const callType = params.callType as string;
  const customerName = params.customerName as string;
  const customerAvatar = params.customerAvatar as string;
  const channelName = params.channelName as string;
  const customerId = params.customerId as string;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const hasAutoClosedRef = useRef(false);
  const hasAcceptedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const guardIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const closeIfSessionNoLongerRinging = (reason: string, status?: string) => {
    if (hasAutoClosedRef.current) return;
    hasAutoClosedRef.current = true;
    stopVibration();
    router.replace('/(tabs)/home');
  };

  const validateSessionStillRinging = async (
    source: 'mount' | 'appstate' | 'interval' | 'accept',
    options?: { ignoreAcceptedGuard?: boolean }
  ) => {
    if (!sessionId || hasAutoClosedRef.current) return true;

    const acceptedNow = hasAcceptedRef.current;
    if (acceptedNow && !options?.ignoreAcceptedGuard) {
      return true;
    }
    try {
      const jwt = await getToken();
      if (!jwt) return true;
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/status`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const status = String(response.data?.data?.status || '');

      // Once accepted, "active" is valid and should not auto-close the screen.
      if (status === 'active' && acceptedNow && !options?.ignoreAcceptedGuard) {
        return true;
      }

      if (!['ringing', 'initiated', 'requested'].includes(status)) {
        closeIfSessionNoLongerRinging(source, status);
        return false;
      }
      return true;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        closeIfSessionNoLongerRinging(source, '404');
        return false;
      }
      return true;
    }
  };

  useEffect(() => {
    console.log('[Consultant] Incoming call screen mounted');
    startVibration();
    startAnimations();

    // If this screen opens from a stale notification/navigation race,
    // close it immediately when session is no longer ringing.
    validateSessionStillRinging('mount');
    guardIntervalRef.current = setInterval(() => {
      validateSessionStillRinging('interval');
    }, 3000);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        validateSessionStillRinging('appstate');
      }
    });

    return () => {
      if (guardIntervalRef.current) {
        clearInterval(guardIntervalRef.current);
        guardIntervalRef.current = null;
      }
      appStateSubscription.remove();
      stopVibration();
    };
  }, []);

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  };

  const startVibration = () => {
    Vibration.vibrate([1000, 1000], true);
  };

  const stopVibration = () => {
    Vibration.cancel();
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);

      return (
        granted['android.permission.RECORD_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const handleAccept = async () => {
    if (hasAccepted || loading) return;

    hasAcceptedRef.current = true;
    setHasAccepted(true);
    setLoading(true);
    stopVibration();

    try {
      const stillRinging = await validateSessionStillRinging('accept', { ignoreAcceptedGuard: true });
      if (!stillRinging) {
        hasAcceptedRef.current = false;
        setHasAccepted(false);
        return;
      }

      if (guardIntervalRef.current) {
        clearInterval(guardIntervalRef.current);
        guardIntervalRef.current = null;
      }

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert('Permission Required', 'Microphone permission is required');
        router.back();
        return;
      }

      const jwt = await getToken();
      if (!jwt) {
        Alert.alert("Error", "Authentication required");
        router.back();
        return;
      }

      const answerRes = await axios.post(
        `${API_BASE_URL}/communication/call/answer`,
        { sessionId },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (!answerRes.data.success) {
        Alert.alert("Error", "Failed to accept call");
        router.back();
        return;
      }

      const { rtcToken, channelName: channel } = answerRes.data.data;

      console.log("[Consultant] Creating Agora engine...");
      const engine = await createEngine(AGORA_APP_ID);
      if (!engine) {
        Alert.alert("Error", "Failed to initialize call engine");
        router.back();
        return;
      }

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: any) => {
          console.log('[Consultant] JOIN SUCCESS! UID:', connection.localUid);
        },
        onUserJoined: (_: any, uid: number) => {
          console.log('[Consultant] Customer joined:', uid);
        },
        onUserOffline: (_: any, uid: number) => {
          console.log('[Consultant] Customer left:', uid);
        },
        onError: (err: any, msg: string) => {
          console.error('[Consultant] Agora error:', err, msg);
        },
      });

      if (callType === 'video') {
        await engine.enableVideo();
      }

      console.log("[Consultant] Joining channel:", channel);
      const joinResult = await engine.joinChannel(rtcToken, channel, 0);
      console.log("[Consultant] Join result:", joinResult);

      if (joinResult !== 0) {
        await engine.release();
        clearEngine();
        Alert.alert("Error", `Join failed: ${joinResult}`);
        router.back();
        return;
      }

      (global as any).consultantEngine = engine;
      startCall(sessionId);

      router.push({
        pathname: "/call",
        params: {
          sessionId,
          callType,
          customerName,
          customerId,
          channelName: channel,
        },
      });

    } catch (err) {
      hasAcceptedRef.current = false;
      setHasAccepted(false);
      console.error("[Consultant] Accept error:", err);
      Alert.alert("Error", "Failed to join call");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    stopVibration();
    const jwt = await getToken();

    try {
      if (jwt) {
        await axios.post(
          `${API_BASE_URL}/communication/call/decline`,
          { sessionId },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
      }
    } catch (e) {
      console.warn("Decline failed, using fallback...");
      if (jwt) {
        await axios.post(
          `${API_BASE_URL}/communication/session/end`,
          { sessionId, autoEnded: true },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
      }
    } finally {
      const engine = (global as any).consultantEngine;
      if (engine) {
        await engine.release();
        clearEngine();
        (global as any).consultantEngine = null;
      }
      router.back();
    }
  };

  const avatarSource = {
    uri: customerAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Image
        source={avatarSource}
        style={styles.backgroundImage}
        blurRadius={40}
      />
      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.topSection}>
          <View style={styles.callTypeContainer}>
            <Ionicons
              name={callType === 'video' ? "videocam" : "call"}
              size={16}
              color="white"
            />
            <Text style={styles.callType}>
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
            </Text>
          </View>

          <Text style={styles.name}>{customerName}</Text>
          <Text style={styles.statusText}>Consultation Request</Text>
        </View>

        <View style={styles.avatarSection}>
          <Animated.View
            style={[
              styles.rippleRing,
              {
                transform: [
                  {
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.5]
                    }),
                  },
                ],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image source={avatarSource} style={styles.avatar} />
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleReject}
              style={styles.actionColumn}
              disabled={loading || hasAccepted}
            >
              <View style={[styles.button, styles.rejectButton]}>
                <Ionicons
                  name="call"
                  size={32}
                  color="white"
                  style={styles.rejectIcon}
                />
              </View>
              <Text style={styles.buttonLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              style={styles.actionColumn}
              disabled={loading || hasAccepted}
            >
              <View style={[styles.button, styles.acceptButton]}>
                <Ionicons
                  name={callType === 'video' ? "videocam" : "call"}
                  size={32}
                  color="white"
                />
              </View>
              <Text style={styles.buttonLabel}>
                {loading ? "Connecting..." : "Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// (Your styles are unchanged — omitted here for brevity)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
    opacity: 0.6,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6
  },
  callType: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  name: {
    color: 'white',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statusText: {
    color: '#cccccc',
    fontSize: 16,
    fontWeight: '400',
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomSection: {
    paddingBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    width: '100%',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#34C759', // iOS Green
  },
  rejectButton: {
    backgroundColor: '#FF3B30', // iOS Red
  },
  rejectIcon: {
    transform: [{ rotate: '135deg' }],
  },
  buttonLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});