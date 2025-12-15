// app/call.tsx (Consultant App)
import { CALL_EMOJIS, POLLING_INTERVALS } from '@/constants/chatConstants';
import { useAuth } from '@/context/AuthContext';
import { useCallContext } from "@/context/CallContext";
import { useIncomingCallPolling } from "@/hooks/useIncomingCallPolling";
import {
  getInCallMessages,
  Message,
  pollCallEmojis,
  sendCallEmoji,
  sendInCallMessage
} from '@/services/chatApi';
import { clearEngine } from "@/utils/rnAgora";
import { getToken } from "@/utils/tokenHelper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { RtcSurfaceView } from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = "https://api.colio.in/api";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOJIS = CALL_EMOJIS;

// Floating notification type
interface FloatingNotification {
  id: number;
  type: 'emoji' | 'message';
  content: string;
  isOwn: boolean;
  animation: Animated.Value;
  senderName?: string;
}

export default function ConsultantCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { endCall } = useCallContext();
  const { resetPolling } = useIncomingCallPolling();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isCustomerConnected, setIsCustomerConnected] = useState(false);

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Floating notifications (emojis + message bubbles)
  const [floatingNotifications, setFloatingNotifications] = useState<FloatingNotification[]>([]);

  // Refs
  const engineRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const hasCleanedUpRef = useRef(false);
  const notificationIdRef = useRef(0);
  const emojiPollRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmojiPollTimeRef = useRef<number>(Date.now());
  const lastChatPollTimeRef = useRef<string>(new Date().toISOString());
  const chatListRef = useRef<FlatList>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  const sessionId = params.sessionId as string;
  const callType = params.callType as string;
  const customerName = params.customerName as string || 'Customer';
  const customerId = params.customerId as string;

  // ✅ Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    StatusBar.setHidden(true);

    engineRef.current = (global as any).consultantEngine;

    if (!engineRef.current) {
      console.error('[Consultant] No engine found!');
      Alert.alert('Error', 'Call engine not found');
      router.back();
      return;
    }

    setupEventListeners();

    if (callType === 'video') {
      setIsVideoEnabled(true);
    }

    // Duration timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // ✅ Start BOTH polling immediately when call starts
    startEmojiPolling();
    startChatPolling();

    // Load initial chat messages
    fetchChatMessages();

    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (emojiPollRef.current) clearInterval(emojiPollRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);

      if (!hasCleanedUpRef.current) {
        cleanup();
      }
    };
  }, []);

  const setupEventListeners = () => {
    if (!engineRef.current) return;

    engineRef.current.registerEventHandler({
      onUserJoined: (connection: any, uid: number) => {
        console.log('[Consultant] Customer joined:', uid);
        setRemoteUid(uid);
        setIsCustomerConnected(true);
      },
      onUserOffline: (connection: any, uid: number, reason: number) => {
        console.log('[Consultant] Customer left');
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

    if (emojiPollRef.current) clearInterval(emojiPollRef.current);
    if (chatPollRef.current) clearInterval(chatPollRef.current);

    try {
      if (engineRef.current) {
        try {
          await engineRef.current.leaveChannel();
        } catch (e) { }

        try {
          await engineRef.current.release();
        } catch (e) { }

        (global as any).consultantEngine = null;
        engineRef.current = null;
        clearEngine();
      }
    } catch (error) {
      console.error('[Consultant] Cleanup error:', error);
    }
  };

  // ============ FLOATING NOTIFICATION ============

  const showFloatingNotification = (
    type: 'emoji' | 'message',
    content: string,
    isOwn: boolean,
    senderName?: string
  ) => {
    const id = notificationIdRef.current++;
    const animation = new Animated.Value(0);

    setFloatingNotifications(prev => [...prev, {
      id,
      type,
      content,
      isOwn,
      animation,
      senderName
    }]);

    Animated.timing(animation, {
      toValue: 1,
      duration: type === 'message' ? 3500 : 2500,
      useNativeDriver: true,
    }).start(() => {
      setFloatingNotifications(prev => prev.filter(n => n.id !== id));
    });
  };

  // ============ EMOJI FUNCTIONS ============

  const startEmojiPolling = () => {
    if (emojiPollRef.current) return;

    console.log('[Consultant] 🎭 Starting emoji polling');
    lastEmojiPollTimeRef.current = Date.now();

    emojiPollRef.current = setInterval(async () => {
      try {
        const result = await pollCallEmojis(sessionId, lastEmojiPollTimeRef.current);

        if (result.emojis?.length > 0) {
          const customerEmojis = result.emojis.filter(e => e.senderType === 'customer');
          customerEmojis.forEach(e => {
            showFloatingNotification('emoji', e.emoji, false);
          });
        }
        lastEmojiPollTimeRef.current = result.serverTime;
      } catch (error) {
        console.error('[Consultant] Emoji poll error:', error);
      }
    }, POLLING_INTERVALS.IN_CALL_EMOJIS);
  };

  const handleSendEmoji = async (emoji: string) => {
    // Show own emoji floating
    showFloatingNotification('emoji', emoji, true);

    try {
      await sendCallEmoji(sessionId, emoji);
    } catch (error) {
      console.error('[Consultant] Send emoji error:', error);
    }
  };

  // ============ CHAT FUNCTIONS ============

  const fetchChatMessages = async () => {
    try {
      const result = await getInCallMessages(sessionId);
      const messages = result.messages || [];
      setChatMessages(messages);

      // Mark all initial messages as processed
      messages.forEach(m => processedMessageIds.current.add(m._id));

      lastChatPollTimeRef.current = result.serverTime;
    } catch (error) {
      console.error('[Consultant] Fetch chat error:', error);
    }
  };

  // ✅ Chat polling starts immediately and runs continuously
  const startChatPolling = () => {
    if (chatPollRef.current) return;

    console.log('[Consultant] 💬 Starting chat polling');

    chatPollRef.current = setInterval(async () => {
      try {
        const result = await getInCallMessages(sessionId, lastChatPollTimeRef.current);

        if (result.messages?.length > 0) {
          result.messages.forEach(msg => {
            // Only process new messages
            if (!processedMessageIds.current.has(msg._id)) {
              processedMessageIds.current.add(msg._id);

              // Add to chat list
              setChatMessages(prev => [...prev, msg]);

              // Check if it's from customer (not own message)
              const isOwn = isOwnMessage(msg);

              // ✅ Show floating bubble for incoming messages (not own)
              if (!isOwn) {
                showFloatingNotification(
                  'message',
                  msg.content,
                  false,
                  customerName
                );
              }
            }
          });

          lastChatPollTimeRef.current = result.serverTime;
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
      const result = await sendInCallMessage(sessionId, content, 'text');

      if (result?.message) {
        // Mark as processed and add to list
        processedMessageIds.current.add(result.message._id);
        setChatMessages(prev => [...prev, result.message]);

        // Show own message as floating bubble too (optional)
        showFloatingNotification('message', content, true);

        setTimeout(() => {
          chatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('[Consultant] Send message error:', error);
      setChatInput(content);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const isOwnMessage = (message: Message): boolean => {
    const currentUserId = user?.userId?.toString() || user?._id?.toString() || user?.id?.toString() || '';
    const senderId = typeof message.sender === 'object'
      ? (message.sender._id?.toString() || '')
      : message.sender?.toString() || '';
    return currentUserId === senderId;
  };

  // ============ CALL CONTROLS ============

  const toggleMute = async () => {
    if (!engineRef.current) return;
    await engineRef.current.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!engineRef.current || callType !== 'video') return;
    await engineRef.current.enableLocalVideo(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const switchCamera = async () => {
    if (!engineRef.current || callType !== 'video') return;
    await engineRef.current.switchCamera();
  };

  const toggleSpeaker = async () => {
    if (!engineRef.current) return;
    await engineRef.current.setEnableSpeakerphone(!isSpeakerOn);
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleEndCall = async () => {
    if (hasCleanedUpRef.current) return;

    try {
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

  // ============ RENDER ============

  const renderChatMessage = ({ item }: { item: Message }) => {
    const isOwn = isOwnMessage(item);

    return (
      <View style={[
        styles.chatBubble,
        isOwn ? styles.chatBubbleOwn : styles.chatBubbleOther
      ]}>
        <Text style={styles.chatBubbleText}>{item.content}</Text>
        <Text style={styles.chatBubbleTime}>
          {new Date(item.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>
    );
  };

  // ✅ Render floating notification (emoji or message bubble)
  const renderFloatingNotification = (notification: FloatingNotification) => {
    const { id, type, content, isOwn, animation, senderName } = notification;

    if (type === 'emoji') {
      return (
        <Animated.Text
          key={id}
          style={[
            styles.floatingEmoji,
            isOwn ? styles.floatingRight : styles.floatingLeft,
            {
              opacity: animation.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -250],
                  }),
                },
                {
                  scale: animation.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0.5, 1.3, 1, 0.8],
                  }),
                },
              ],
            },
          ]}
        >
          {content}
        </Animated.Text>
      );
    }

    // Message bubble
    return (
      <Animated.View
        key={id}
        style={[
          styles.floatingMessageBubble,
          isOwn ? styles.floatingRight : styles.floatingLeft,
          {
            opacity: animation.interpolate({
              inputRange: [0, 0.1, 0.85, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -180],
                }),
              },
              {
                scale: animation.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0.8, 1, 1, 0.9],
                }),
              },
            ],
          },
        ]}
      >
        {!isOwn && senderName && (
          <Text style={styles.floatingMessageSender}>{senderName}</Text>
        )}
        <Text style={styles.floatingMessageText} numberOfLines={3}>
          {content}
        </Text>
      </Animated.View>
    );
  };

  // Calculate chat panel position based on keyboard
  const chatPanelBottom = keyboardVisible
    ? keyboardHeight + 10
    : 160;

  return (
    <View style={styles.container}>
      {/* Background */}
      {callType === 'video' && remoteUid !== 0 ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
          zOrderMediaOverlay={false}
        />
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.backgroundGradient}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={60} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.callStatusText}>
              {isCustomerConnected ? 'Connected' : 'Connecting...'}
            </Text>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Local Video (PiP) */}
      {callType === 'video' && isVideoEnabled && (
        <View style={[styles.localVideoContainer, { top: insets.top + 60 }]}>
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: 0 }}
            zOrderMediaOverlay={true}
          />
        </View>
      )}

      {/* ✅ Floating Notifications (Emojis + Message Bubbles) */}
      {floatingNotifications.map(renderFloatingNotification)}

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBarStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isCustomerConnected ? '#22C55E' : '#F59E0B' }
          ]} />
          <Text style={styles.topBarStatusText}>
            {isCustomerConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
        <Text style={styles.topBarDuration}>{formatDuration(duration)}</Text>
      </View>

      {/* ✅ Chat Panel with keyboard handling */}
      {showChat && (
        <View
          style={[
            styles.chatPanel,
            {
              bottom: chatPanelBottom,
              maxHeight: keyboardVisible ? SCREEN_HEIGHT * 0.35 : SCREEN_HEIGHT * 0.45
            }
          ]}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderText}>Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={chatListRef}
            data={chatMessages}
            keyExtractor={(item) => item._id}
            renderItem={renderChatMessage}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>No messages yet</Text>
              </View>
            }
          />

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  chatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            <TouchableOpacity
              style={[
                styles.chatSendButton,
                (!chatInput.trim() || isSendingMessage) && styles.chatSendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Controls - Hidden when keyboard is visible */}
      {!keyboardVisible && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
          {/* Emoji Row */}
          <View style={styles.emojiRow}>
            <TouchableOpacity
              style={[styles.emojiButton, showChat && styles.emojiButtonActive]}
              onPress={() => setShowChat(!showChat)}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="white" />
            </TouchableOpacity>
            {EMOJIS.slice(0, 5).map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiButton}
                onPress={() => handleSendEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Controls - NO END BUTTON for Consultant */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color="white" />
            </TouchableOpacity>

            {callType === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                onPress={toggleVideo}
              >
                <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={26} color="white" />
              </TouchableOpacity>
            )}

            {callType === 'video' && isVideoEnabled && (
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <Ionicons name="camera-reverse" size={26} color="white" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  callStatusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  localVideoContainer: {
    position: 'absolute',
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  // ✅ Floating notifications
  floatingEmoji: {
    position: 'absolute',
    bottom: 200,
    fontSize: 50,
    zIndex: 100,
  },
  floatingRight: {
    right: 40,
  },
  floatingLeft: {
    left: 40,
  },
  floatingMessageBubble: {
    position: 'absolute',
    bottom: 200,
    maxWidth: SCREEN_WIDTH * 0.6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingMessageSender: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 2,
  },
  floatingMessageText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  topBarStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  topBarDuration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  chatPanel: {
    position: 'absolute',
    left: 15,
    right: 15,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  chatList: {
    maxHeight: SCREEN_HEIGHT * 0.25,
  },
  chatListContent: {
    padding: 15,
  },
  chatEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  chatEmptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  chatBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 3,
  },
  chatBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    color: 'white',
    fontSize: 15,
  },
  chatBubbleTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
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
    fontSize: 15,
    maxHeight: 80,
    marginRight: 10,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonActive: {
    backgroundColor: '#4CAF50',
  },
  emojiText: {
    fontSize: 22,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
});