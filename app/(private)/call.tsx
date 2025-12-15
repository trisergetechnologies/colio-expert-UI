// app/call.tsx (Consultant App - With Emoji Sync + In-Call Chat)
import { useCallContext } from "@/context/CallContext";
import { useIncomingCallPolling } from "@/hooks/useIncomingCallPolling";
import { clearEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { RtcSurfaceView } from 'react-native-agora';

// ✅ Import chat API and constants
import { CALL_EMOJIS, POLLING_INTERVALS } from '@/constants/chatConstants';
import {
  getInCallMessages,
  Message,
  pollCallEmojis,
  sendCallEmoji,
  sendInCallMessage
} from '@/services/chatApi';

const API_BASE_URL = "https://api.colio.in/api";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ Use emojis from constants
const EMOJIS = CALL_EMOJIS;

export default function ConsultantCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isCustomerConnected, setIsCustomerConnected] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // ✅ Emoji states
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{id: number, emoji: string, animation: Animated.Value, fromRemote?: boolean}>>([]);
  
  // ✅ In-call chat states
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const engineRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const hasCleanedUpRef = useRef(false);
  const controlsTimerRef = useRef<any>(null);
  const emojiIdRef = useRef(0);
  
  // ✅ Polling refs
  const emojiPollRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmojiPollTimeRef = useRef<number>(Date.now());
  const lastChatPollTimeRef = useRef<string>(new Date().toISOString());
  
  const { endCall } = useCallContext();
  const { resetPolling } = useIncomingCallPolling();

  const sessionId = params.sessionId as string;
  const callType = params.callType as string;
  const customerName = params.customerName as string;

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
    
    // Duration timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // ✅ Start emoji polling
    startEmojiPolling();
    
    // ✅ Load initial in-call messages
    loadInCallMessages();

    return () => {
      console.log('[Consultant] 📱 Unmounting');
      StatusBar.setHidden(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (emojiPollRef.current) clearInterval(emojiPollRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      
      if (!hasCleanedUpRef.current) {
        cleanup();
      }
    };
  }, []);

  // ✅ Start/stop chat polling when chat panel opens/closes
  useEffect(() => {
    if (showChat) {
      startChatPolling();
    } else {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
        chatPollRef.current = null;
      }
    }
  }, [showChat]);

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

  // ✅ EMOJI POLLING - Receive emojis from customer
  const startEmojiPolling = () => {
    if (emojiPollRef.current) return;
    
    console.log('[Consultant] 🎭 Starting emoji polling');
    lastEmojiPollTimeRef.current = Date.now();
    
    emojiPollRef.current = setInterval(async () => {
      try {
        const result = await pollCallEmojis(sessionId, lastEmojiPollTimeRef.current);
        
        if (result.emojis && result.emojis.length > 0) {
          // Filter only customer's emojis (not our own)
          const customerEmojis = result.emojis.filter(e => e.senderType === 'customer');
          
          customerEmojis.forEach(emojiData => {
            showReceivedEmoji(emojiData.emoji);
          });
        }
        
        lastEmojiPollTimeRef.current = result.serverTime;
      } catch (error) {
        console.error('[Consultant] Emoji poll error:', error);
      }
    }, POLLING_INTERVALS.IN_CALL_EMOJIS);
  };

  // ✅ Show received emoji (from customer) - animates from LEFT
  const showReceivedEmoji = (emoji: string) => {
    const id = emojiIdRef.current++;
    const animation = new Animated.Value(0);
    
    setFloatingEmojis(prev => [...prev, { id, emoji, animation, fromRemote: true }]);
    
    Animated.timing(animation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
  };

  // ✅ SEND EMOJI - Send to API + animate locally
  const sendEmoji = async (emoji: string) => {
    // Animate locally (from RIGHT)
    const id = emojiIdRef.current++;
    const animation = new Animated.Value(0);
    
    setFloatingEmojis(prev => [...prev, { id, emoji, animation, fromRemote: false }]);
    
    Animated.timing(animation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
    
    // Send to API
    try {
      await sendCallEmoji(sessionId, emoji);
      console.log('[Consultant] 🎭 Emoji sent:', emoji);
    } catch (error) {
      console.error('[Consultant] Failed to send emoji:', error);
    }
  };

  // ✅ CHAT FUNCTIONS
  const loadInCallMessages = async () => {
    try {
      const messages = await getInCallMessages(sessionId);
      setChatMessages(messages);
      lastChatPollTimeRef.current = new Date().toISOString();
    } catch (error) {
      console.error('[Consultant] Failed to load messages:', error);
    }
  };

  const startChatPolling = () => {
    if (chatPollRef.current) return;
    
    console.log('[Consultant] 💬 Starting chat polling');
    
    chatPollRef.current = setInterval(async () => {
      try {
        const messages = await getInCallMessages(sessionId);
        if (messages.length > chatMessages.length) {
          setChatMessages(messages);
        }
      } catch (error) {
        console.error('[Consultant] Chat poll error:', error);
      }
    }, POLLING_INTERVALS.IN_CALL_MESSAGES);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;
    
    const content = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    
    try {
      const newMessage = await sendInCallMessage(sessionId, content);
      if (newMessage) {
        setChatMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('[Consultant] Failed to send message:', error);
      setChatInput(content); // Restore on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  const cleanup = async () => {
    if (hasCleanedUpRef.current) return;
    hasCleanedUpRef.current = true;
    
    // Stop all polling
    if (emojiPollRef.current) clearInterval(emojiPollRef.current);
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    
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
        { sessionId },
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

  // ✅ Render chat message
  const renderChatMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender._id !== params.customerId;
    
    return (
      <View style={[
        styles.chatBubble,
        isOwnMessage ? styles.chatBubbleOwn : styles.chatBubbleOther
      ]}>
        <Text style={styles.chatBubbleText}>{item.content}</Text>
      </View>
    );
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
          <Text style={styles.customerName}>{customerName}</Text>
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

      {/* ✅ Floating Emojis */}
      {floatingEmojis.map(({ id, emoji, animation, fromRemote }) => (
        <Animated.Text
          key={id}
          style={[
            styles.floatingEmoji,
            fromRemote ? styles.floatingEmojiLeft : styles.floatingEmojiRight,
            {
              opacity: animation.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -200],
                  }),
                },
                {
                  scale: animation.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0.5, 1.2, 1, 0.8],
                  }),
                },
              ],
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      ))}

      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <Text style={styles.statusText}>
          {isCustomerConnected ? '🟢 Connected' : '🟡 Connecting...'}
        </Text>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>

      {/* ✅ Emoji Bar */}
      <View style={styles.emojiBar}>
        {EMOJIS.slice(0, 6).map((emoji, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => sendEmoji(emoji)}
            style={styles.emojiButton}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ✅ In-Call Chat Panel */}
      {showChat && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatPanel}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderText}>In-Call Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={chatMessages}
            keyExtractor={(item) => item._id}
            renderItem={renderChatMessage}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            inverted={false}
          />
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
              style={[
                styles.chatSendButton,
                (!chatInput.trim() || isSendingMessage) && styles.chatSendButtonDisabled
              ]}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

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

          {/* ✅ Chat Toggle */}
          <TouchableOpacity
            onPress={() => setShowChat(!showChat)}
            style={[styles.button, showChat && styles.buttonActiveChat]}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          </TouchableOpacity>

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
  // ✅ Emoji Bar Styles
  emojiBar: {
    position: 'absolute',
    top: 120,
    left: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 8,
    gap: 4,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 24,
  },
  // ✅ Floating Emoji Styles
  floatingEmoji: {
    position: 'absolute',
    fontSize: 50,
    bottom: 200,
  },
  floatingEmojiRight: {
    right: 40,
  },
  floatingEmojiLeft: {
    left: 40,
  },
  // ✅ Chat Panel Styles
  chatPanel: {
    position: 'absolute',
    bottom: 140,
    left: 10,
    right: 10,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 10,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  chatBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    color: 'white',
    fontSize: 14,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: 'white',
    fontSize: 14,
    maxHeight: 80,
    marginRight: 10,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
  },
  // Bottom Bar
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
    gap: 15,
  },
  button: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  buttonActiveChat: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  endButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});