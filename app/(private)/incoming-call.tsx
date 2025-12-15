// app/incoming-call.tsx (Consultant App - With Proper Decline API)
import { useCallContext } from "@/context/CallContext";
import { clearEngine, createEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";

const API_BASE_URL = "https://api.colio.in/api";
const AGORA_APP_ID = "8b9ed38f29bb4b1bbc7958f5fda8b054";

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

  useEffect(() => {
    console.log('[Consultant] Incoming call screen mounted');
    console.log('[Consultant] Session:', sessionId);
    console.log('[Consultant] Customer:', customerName, customerId);
    startVibration();

    return () => {
      stopVibration();
    };
  }, []);

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

  return (
    <View style={styles.container}>
      {/* Avatar with pulse animation */}
      <View style={styles.avatarContainer}>
        <View style={styles.pulseOuter}>
          <View style={styles.pulseInner}>
            <Image
              source={{
                uri: customerAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.avatar}
            />
          </View>
        </View>
      </View>

      {/* Caller info */}
      <Text style={styles.name}>{customerName || 'Customer'}</Text>
      <Text style={styles.callType}>
        Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
      </Text>

      {/* Accept/Decline buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handleReject}
          style={[styles.button, styles.rejectButton]}
          disabled={loading || hasAccepted}
        >
          <Ionicons name="call" size={36} color="white" style={styles.rejectIcon} />
          <Text style={styles.buttonLabel}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAccept}
          style={[styles.button, styles.acceptButton]}
          disabled={loading || hasAccepted}
        >
          <Ionicons name="call" size={36} color="white" />
          <Text style={styles.buttonLabel}>
            {loading ? 'Connecting...' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 40,
  },
  pulseOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  name: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  callType: {
    color: '#888',
    fontSize: 16,
    marginBottom: 80,
  },
  controls: {
    flexDirection: 'row',
    gap: 50,
    marginTop: 'auto',
    marginBottom: 80,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#ff3b30',
  },
  rejectIcon: {
    transform: [{ rotate: '135deg' }],
  },
  buttonLabel: {
    color: 'white',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
});