// app/call.tsx (Consultant App)
import { useCallContext } from "@/context/CallContext";
import { useIncomingCallPolling } from "@/hooks/useIncomingCallPolling";
import { clearEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const API_BASE_URL = "https://api.colio.in/api";

export default function ConsultantCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isCustomerConnected, setIsCustomerConnected] = useState(false);
  const engineRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  
  const { endCall } = useCallContext();
  const { resetPolling } = useIncomingCallPolling();

  useEffect(() => {
    // ✅ Get engine from global
    engineRef.current = (global as any).consultantEngine;
    
    if (engineRef.current) {
      setupEventListeners();
    }
    
    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cleanup();
    };
  }, []);

  const setupEventListeners = () => {
    if (!engineRef.current) return;

    console.log('[Consultant] Setting up call screen event listeners');

    // Note: Listeners already set in incoming-call screen
    // Just update states based on existing listeners
    
    // Add additional listener for this screen
    engineRef.current.registerEventHandler({
      onUserJoined: (connection: any, remoteUid: number) => {
        console.log('[Consultant] Customer connected in call screen');
        setIsCustomerConnected(true);
      },
      
      onUserOffline: (connection: any, remoteUid: number, reason: number) => {
        console.log('[Consultant] Customer disconnected in call screen');
        setIsCustomerConnected(false);
        
        Alert.alert('Call Ended', 'The customer has left the call', [
          { text: 'OK', onPress: () => handleEndCall() }
        ]);
      },
    });
  };

const cleanup = async () => {
  try {
    if (engineRef.current) {
      console.log('[Consultant] Cleaning up engine...');
      
      try {
        await engineRef.current.leaveChannel();
        console.log('[Consultant] Left channel');
      } catch (e) {
        console.warn('[Consultant] Leave error:', e);
      }
      
      try {
        await engineRef.current.release();
        console.log('[Consultant] Engine released');
      } catch (e) {
        console.warn('[Consultant] Release error:', e);
      }
      
      // Clear references
      (global as any).consultantEngine = null;
      engineRef.current = null;
      
      // ✅ CRITICAL: Clear the global engine instance
      clearEngine();
      console.log('[Consultant] Engine instance cleared from global');
    }
  } catch (error) {
    console.error('[Consultant] Cleanup error:', error);
  }
};

  const toggleMute = async () => {
    try {
      if (!engineRef.current) return;
      await engineRef.current.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
      console.log('[Consultant] Mute toggled:', !isMuted);
    } catch (error) {
      console.error('[Consultant] Mute toggle error:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      console.log('[Consultant] Ending call...');
      const jwt = await getToken();
      
      await axios.post(
        `${API_BASE_URL}/communication/session/end`,
        { sessionId: params.sessionId },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      
      console.log('[Consultant] Call ended on backend');
    } catch (error) {
      console.error('[Consultant] End call error:', error);
    } finally {
      await cleanup();
      endCall(); // Mark as available
      resetPolling(); // Resume polling
      router.back();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.customerName}>{params.customerName}</Text>
        <Text style={[
          styles.status,
          { color: isCustomerConnected ? '#4CAF50' : '#FFA500' }
        ]}>
          {isCustomerConnected ? '🟢 Connected' : '🟡 Waiting...'}
        </Text>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleMute}
          style={[styles.button, isMuted && styles.mutedButton]}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={32} color="white" />
          <Text style={styles.buttonLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEndCall} style={[styles.button, styles.endCall]}>
          <Ionicons name="call" size={32} color="white" />
          <Text style={styles.buttonLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  customerName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  duration: {
    color: '#888',
    fontSize: 32,
    fontWeight: '300',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 'auto',
    marginBottom: 60,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedButton: {
    backgroundColor: '#666',
  },
  endCall: {
    backgroundColor: '#ff3b30',
  },
  buttonLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});