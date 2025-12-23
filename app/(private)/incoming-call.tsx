// app/incoming-call.tsx
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
  const customerId = params.customerId as string; // ✅ Added for chat bubble alignment

  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[Consultant] Incoming call screen mounted');
    console.log('[Consultant] Session:', sessionId);
    console.log('[Consultant] Customer:', customerName, customerId);
    startVibration();
    startAnimations();

    return () => {
      stopVibration();
    };
  }, []);

  const startAnimations = () => {
    // Breathing animation for avatar
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

    // Ripple effect
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
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        
        console.log('[Consultant] Permissions:', granted);
        
        const audioGranted = granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (!audioGranted) {
          Alert.alert('Permission Required', 'Microphone permission is required for calls');
          return false;
        }
        
        return true;
      } catch (err) {
        console.error('[Consultant] Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleAccept = async () => {
    if (hasAccepted || loading) return;

    setHasAccepted(true);
    setLoading(true);
    stopVibration();

    try {
      console.log('[Consultant] === ACCEPTING CALL ===');
      
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setHasAccepted(false);
        setLoading(false);
        router.back();
        return;
      }
      
      const jwt = await getToken();
      if (!jwt) {
        alert('Authentication required');
        setHasAccepted(false);
        setLoading(false);
        router.back();
        return;
      }
      
      // Call the answer API
      const answerRes = await axios.post(
        `${API_BASE_URL}/communication/call/answer`,
        { sessionId },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (!answerRes.data.success) {
        alert('Failed to accept call');
        setHasAccepted(false);
        setLoading(false);
        router.back();
        return;
      }

      const { rtcToken, channelName: channel } = answerRes.data.data;
      console.log('[Consultant] Got token');
      console.log('[Consultant] Channel:', channel);

      // Create Agora engine
      console.log('[Consultant] Creating Agora engine...');
      const engine = await createEngine(AGORA_APP_ID);
      if (!engine) {
        alert('Failed to initialize call engine');
        setHasAccepted(false);
        setLoading(false);
        router.back();
        return;
      }
      console.log('[Consultant] ✅ Engine ready');

      // Register event handlers
      console.log('[Consultant] Registering event handlers...');
      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: any, elapsed: number) => {
          console.log('[Consultant] 🎊 JOIN SUCCESS!');
          console.log('[Consultant] My UID:', connection.localUid);
        },
        
        onUserJoined: (connection: any, uid: number, elapsed: number) => {
          console.log('[Consultant] 👤 CUSTOMER JOINED! UID:', uid);
        },
        
        onUserOffline: (connection: any, uid: number, reason: number) => {
          console.log('[Consultant] 👋 Customer left, reason:', reason);
        },
        
        onError: (err: any, msg: string) => {
          console.error('[Consultant] ❌ Agora error:', err, msg);
        },
      });

      // Enable video if video call
      if (callType === 'video') {
        await engine.enableVideo();
        console.log('[Consultant] ✅ Video enabled');
      }

      // Join channel
      console.log('[Consultant] Joining channel:', channel);
      const joinResult = await engine.joinChannel(rtcToken, channel, 0);
      console.log('[Consultant] Join result:', joinResult);

      if (joinResult !== 0) {
        console.error('[Consultant] ❌ Join failed:', joinResult);
        alert(`Failed to join call (code: ${joinResult})`);
        try {
          await engine.release();
        } catch (e) {}
        clearEngine();
        setHasAccepted(false);
        setLoading(false);
        router.back();
        return;
      }

      // Success - store engine globally and navigate
      startCall(sessionId);
      (global as any).consultantEngine = engine;

      // Navigate to call screen with all required params
      router.push({
        pathname: '/call',
        params: {
          sessionId,
          callType,
          customerName,
          customerId, // ✅ Pass customerId for chat bubble alignment in call screen
          channelName: channel,
        },
      });
    } catch (err: any) {
      console.error('[Consultant] ❌ Accept error:', err);
      
      if (err?.response?.status === 404) {
        console.log('[Consultant] Call already answered or ended');
        Alert.alert('Call Unavailable', 'This call is no longer available');
      } else {
        alert('Failed to join call');
      }
      
      setHasAccepted(false);
      setLoading(false);
      router.back();
    }
  };

  // ✅ MODIFIED: Use proper /call/decline API instead of /session/end
  const handleReject = async () => {
    if (hasAccepted) return;
    stopVibration();

    try {
      console.log('[Consultant] 📞 Declining call...');
      const jwt = await getToken();
      
      if (jwt) {
        // ✅ Use the new decline endpoint - creates proper call_log message
        await axios.post(
          `${API_BASE_URL}/communication/call/decline`,
          { sessionId },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        console.log('[Consultant] ✅ Call declined successfully');
      }
    } catch (err: any) {
      console.warn("[Consultant] Decline error:", err?.response?.data || err.message);
      
      // Fallback to old endpoint if decline fails (backwards compatibility)
      try {
        console.log('[Consultant] Trying fallback endpoint...');
        const jwt = await getToken();
        if (jwt) {
          await axios.post(
            `${API_BASE_URL}/communication/session/end`,
            { sessionId, autoEnded: true },
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          console.log('[Consultant] ✅ Fallback decline successful');
        }
      } catch (fallbackErr) {
        console.warn('[Consultant] Fallback end also failed:', fallbackErr);
      }
    } finally {
      // Clear engine if it exists (shouldn't exist on decline, but safety check)
      const engine = (global as any).consultantEngine;
      if (engine) {
        try {
          await engine.release();
          console.log("[Consultant] Engine released on reject");
        } catch (e) {
          console.warn("[Consultant] Release error:", e);
        }
        (global as any).consultantEngine = null;
        clearEngine();
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
      
      {/* 1. Immersive Background Layer */}
      <Image
        source={avatarSource}
        style={styles.backgroundImage}
        blurRadius={40}
      />
      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.contentContainer}>
        {/* 2. Top Info */}
        <View style={styles.topSection}>
            <View style={styles.callTypeContainer}>
                <Ionicons 
                    name={callType === 'video' ? "videocam" : "call"} 
                    size={16} 
                    color="#rgba(255,255,255,0.8)" 
                />
                <Text style={styles.callType}>
                    Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
                </Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>{customerName || 'Unknown Caller'}</Text>
            <Text style={styles.statusText}>Consultation Request</Text>
        </View>

        {/* 3. Center Animated Avatar */}
        <View style={styles.avatarSection}>
          {/* Ripple Effect */}
          <Animated.View
            style={[
              styles.rippleRing,
              {
                transform: [{ scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2.5]
                })}],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0]
                })
              }
            ]}
          />
          {/* Main Breathing Avatar */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image source={avatarSource} style={styles.avatar} />
          </Animated.View>
        </View>

        {/* 4. Bottom Actions */}
        <View style={styles.bottomSection}>
          <View style={styles.controls}>
            {/* Decline */}
            <TouchableOpacity
              onPress={handleReject}
              style={styles.actionColumn}
              disabled={loading || hasAccepted}
              activeOpacity={0.7}
            >
              <View style={[styles.button, styles.rejectButton]}>
                <Ionicons name="call" size={32} color="white" style={styles.rejectIcon} />
              </View>
              <Text style={styles.buttonLabel}>Decline</Text>
            </TouchableOpacity>

            {/* Accept */}
            <TouchableOpacity
              onPress={handleAccept}
              style={styles.actionColumn}
              disabled={loading || hasAccepted}
              activeOpacity={0.7}
            >
              <View style={[styles.button, styles.acceptButton]}>
                <Ionicons name={callType === 'video' ? "videocam" : "call"} size={32} color="white" />
              </View>
              <Text style={styles.buttonLabel}>
                {loading ? 'Connecting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

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