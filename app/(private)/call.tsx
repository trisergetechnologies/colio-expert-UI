// app/call.tsx (Consultant App - Lite Version)
import { useCallContext } from "@/context/CallContext";
import { useIncomingCallPolling } from "@/hooks/useIncomingCallPolling";
import { clearEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { RtcSurfaceView } from 'react-native-agora';

const API_BASE_URL = "https://api.colio.in/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ConsultantCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isCustomerConnected, setIsCustomerConnected] = useState(false);
  
  const engineRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const hasCleanedUpRef = useRef(false);
  
  const { endCall } = useCallContext();
  const { resetPolling } = useIncomingCallPolling();

  const callType = params.callType as string;

  useEffect(() => {
    console.log('[Consultant] 📱 Call screen mounted');
    StatusBar.setHidden(true);
    
    engineRef.current = (global as any).consultantEngine;
    
    if (!engineRef.current) {
      console.error('[Consultant] ❌ No engine found!');
      Alert.alert('Error', 'Call engine not found');
      router.back();
      return;
    }
    
    console.log('[Consultant] ✅ Engine retrieved');
    setupEventListeners();
    
    if (callType === 'video') {
      setIsVideoEnabled(true);
    }
    
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      console.log('[Consultant] 📱 Unmounting');
      StatusBar.setHidden(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (!hasCleanedUpRef.current) {
        cleanup();
      }
    };
  }, []);

  const setupEventListeners = () => {
    if (!engineRef.current) return;

    console.log('[Consultant] Setting up listeners');
    
    engineRef.current.registerEventHandler({
      onUserJoined: (connection: any, uid: number) => {
        console.log('[Consultant] 👤 Customer joined! UID:', uid);
        setRemoteUid(uid);
        setIsCustomerConnected(true);
      },
      
      onUserOffline: (connection: any, uid: number, reason: number) => {
        console.log('[Consultant] 👋 Customer left');
        setRemoteUid(0);
        setIsCustomerConnected(false);
        
        setTimeout(() => {
          Alert.alert('Call Ended', 'Customer left the call', [
            { text: 'OK', onPress: () => handleEndCall() }
          ]);
        }, 500);
      },
    });
  };

  const cleanup = async () => {
    if (hasCleanedUpRef.current) return;
    hasCleanedUpRef.current = true;
    
    try {
      if (engineRef.current) {
        console.log('[Consultant] Cleaning up...');
        
        try {
          await engineRef.current.leaveChannel();
        } catch (e) {}
        
        try {
          await engineRef.current.release();
        } catch (e) {}
        
        (global as any).consultantEngine = null;
        engineRef.current = null;
        clearEngine();
      }
    } catch (error) {
      console.error('[Consultant] Cleanup error:', error);
    }
  };

  const toggleMute = async () => {
    if (!engineRef.current) return;
    await engineRef.current.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!engineRef.current || callType !== 'video') return;
    const newState = !isVideoEnabled;
    await engineRef.current.enableLocalVideo(newState);
    setIsVideoEnabled(newState);
  };

  const switchCamera = async () => {
    if (!engineRef.current || callType !== 'video') return;
    await engineRef.current.switchCamera();
  };

  const handleEndCall = async () => {
    if (hasCleanedUpRef.current) return;
    
    try {
      console.log('[Consultant] Ending call...');
      const jwt = await getToken();
      
      await axios.post(
        `${API_BASE_URL}/communication/session/end`,
        { sessionId: params.sessionId },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
    } catch (error) {
      console.error('[Consultant] End error:', error);
    } finally {
      await cleanup();
      endCall();
      
      setTimeout(() => {
        resetPolling();
      }, 500);
      
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
      {/* Remote Video */}
      {callType === 'video' && remoteUid !== 0 ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
          zOrderMediaOverlay={false}
        />
      ) : (
        <View style={styles.voiceBackground}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={80} color="#fff" />
          </View>
          <Text style={styles.customerName}>{params.customerName}</Text>
        </View>
      )}

      {/* Local Video - Fixed Position */}
      {callType === 'video' && isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: 0 }}
            zOrderMediaOverlay={true}
          />
        </View>
      )}

      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <Text style={styles.statusText}>
          {isCustomerConnected ? '🟢 Connected' : '🟡 Connecting...'}
        </Text>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <View style={styles.controls}>
          {/* Mute */}
          <TouchableOpacity
            onPress={toggleMute}
            style={[styles.button, isMuted && styles.buttonActive]}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
          </TouchableOpacity>

          {/* Video Toggle */}
          {callType === 'video' && (
            <TouchableOpacity
              onPress={toggleVideo}
              style={[styles.button, !isVideoEnabled && styles.buttonActive]}
            >
              <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {/* End Call */}
          <TouchableOpacity onPress={handleEndCall} style={styles.endButton}>
            <Ionicons name="call" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Switch Camera */}
          {callType === 'video' && isVideoEnabled && (
            <TouchableOpacity onPress={switchCamera} style={styles.button}>
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Speaker */}
          <TouchableOpacity style={styles.button}>
            <Ionicons name="volume-high" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  voiceBackground: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  durationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  endButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});