// app/call.tsx (Consultant App)
import { CallEndedAlert } from '@/components/CallAlert';
import { CALL_EMOJIS, POLLING_INTERVALS } from '@/constants/chatConstants';
import { useAuth } from '@/context/AuthContext';
import { useCallContext } from "@/context/CallContext";
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
  Easing,
  FlatList,
  Image,
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

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isCustomerConnected, setIsCustomerConnected] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [alertMessage, setAlertMessage] = useState('Call ended');

  const [floatingNotifications, setFloatingNotifications] = useState<FloatingNotification[]>([]);

  const sessionPollRef = useRef<NodeJS.Timeout | null>(null);
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

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const sessionId = params.sessionId as string;
  const callType = params.callType as string;
  const customerName = params.customerName as string || 'Customer';
  const customerId = params.customerId as string;
  const customerAvatar =
    (params.customerAvatar as string) ||
    'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Keyboard listeners
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
    startPulseAnimation();

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

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    startEmojiPolling();
    startChatPolling();
    startSessionPolling();
    const content = "Hii".trim();
    const result = sendInCallMessage(sessionId, content, 'text');

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

  const startPulseAnimation = () => {
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
  };

  const setupEventListeners = () => {
    if (!engineRef.current) return;

    engineRef.current.registerEventHandler({
      onUserJoined: (connection: any, uid: number) => {
        console.log('[Consultant] Customer joined:', uid);
        setRemoteUid(uid);
        setIsCustomerConnected(true);
      },
      onUserOffline: () => {
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
        } catch {}

        try {
          await engineRef.current.release();
        } catch {}

        (global as any).consultantEngine = null;
        engineRef.current = null;
        clearEngine();
      }
    } catch (error) {
      console.error('[Consultant] Cleanup error:', error);
    }
  };

  const showFloatingNotification = (
    type: 'emoji' | 'message',
    content: string,
    isOwn: boolean,
    senderName?: string
  ) => {
    const id = notificationIdRef.current++;
    const animation = new Animated.Value(0);

    setFloatingNotifications((prev) => [
      ...prev,
      { id, type, content, isOwn, animation, senderName },
    ]);

    Animated.timing(animation, {
      toValue: 1,
      duration: type === 'message' ? 3500 : 2500,
      useNativeDriver: true,
    }).start(() => {
      setFloatingNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );
    });
  };

  const startEmojiPolling = async () => {
    if (emojiPollRef.current) return;

    console.log('[Consultant] 🎭 Starting emoji polling');
    lastEmojiPollTimeRef.current = Date.now();

    emojiPollRef.current = setInterval(async () => {
      try {
        const result = await pollCallEmojis(
          sessionId,
          lastEmojiPollTimeRef.current
        );

        if (result.emojis?.length > 0) {
          const customerEmojis = result.emojis.filter(
            (e) => e.senderType === 'customer'
          );

          customerEmojis.forEach((e) => {
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
    showFloatingNotification('emoji', emoji, true);

    try {
      await sendCallEmoji(sessionId, emoji);
    } catch (error) {
      console.error('[Consultant] Send emoji error:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const result = await getInCallMessages(sessionId);
      const messages = result?.messages || [];

      setChatMessages(messages);

      messages.forEach((m) => processedMessageIds.current.add(m._id));

      lastChatPollTimeRef.current = result.serverTime;
    } catch (error) {
      console.error('[Consultant] Fetch chat error:', error);
    }
  };

  const startChatPolling = () => {
    if (chatPollRef.current) return;

    console.log('[Consultant] 💬 Starting chat polling');

    chatPollRef.current = setInterval(async () => {
      try {
        const result = await getInCallMessages(
          sessionId,
          lastChatPollTimeRef.current
        );

        if (result?.messages?.length > 0) {
          result.messages.forEach((msg) => {
            if (!processedMessageIds.current.has(msg._id)) {
              processedMessageIds.current.add(msg._id);

              setChatMessages((prev) => [...prev, msg]);

              // Check if it's from customer (not own message)
              const isOwn = isOwnMessage(msg);

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

  const startSessionPolling = () => {
    if (sessionPollRef.current) return;

    console.log('[Consultant] 📊 Starting session status polling');

    sessionPollRef.current = setInterval(async () => {
      try {
        const jwt = await getToken();
        const response = await axios.get(
          `${API_BASE_URL}/session/${sessionId}/status`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        if (response.data.success) {
          const { status, autoEnded, endReason } = response.data.data;

          if (status === 'ended') {
            if (sessionPollRef.current) {
              clearInterval(sessionPollRef.current);
              sessionPollRef.current = null;
            }

            const message =
              autoEnded && endReason === 'insufficient_balance'
                ? 'Call ended - Customer balance depleted'
                : 'Call ended by customer';

            setAlertMessage(message);
            setShowAlert(true);
          }
        }
      } catch (error) {
        console.error('[Consultant] Session poll error:', error);
      }
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const content = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const result = await sendInCallMessage(sessionId, content, 'text');

      if (result?.message) {
        processedMessageIds.current.add(result.message._id);
        setChatMessages((prev) => [...prev, result.message]);

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

  const isOwnMessage = (message: any): boolean => {
    const currentUserId = user?.userId?.toString();
    const senderId =
      typeof message.sender === 'object'
        ? message.sender._id?.toString() || ''
        : message.sender?.toString() || '';

    return currentUserId === senderId;
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
      router.replace('/(tabs)/home');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const renderChatMessage = ({ item }: { item: Message }) => {
    const isOwn = isOwnMessage(item);

    return (
      <View
        style={[
          styles.chatBubble,
          isOwn ? styles.chatBubbleOwn : styles.chatBubbleOther,
        ]}
      >
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
                    outputRange: [0, -350],
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
                  outputRange: [0, -250],
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

  const chatPanelBottom = keyboardVisible
    ? keyboardHeight + 10
    : 110;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {callType === "video" && remoteUid !== 0 ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
          zOrderMediaOverlay={false}
        />
      ) : (
        <View style={styles.audioBackgroundContainer}>
          <Image
            source={{ uri: customerAvatar }}
            style={styles.backgroundImage}
            blurRadius={50}
          />
          <View style={styles.backgroundOverlay} />

          <View style={styles.centerContent}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.mainAvatarContainer}>
                <Image
                  source={{ uri: customerAvatar }}
                  style={styles.mainAvatar}
                />
              </View>
            </Animated.View>

            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.callStatusText}>
              {isCustomerConnected
                ? "Consultation in Progress"
                : "Connecting..."}
            </Text>
          </View>
        </View>
      )}

      {callType === "video" && isVideoEnabled && (
        <View style={[styles.localVideoContainer, { top: insets.top + 60 }]}>
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: 0 }}
            zOrderMediaOverlay={true}
          />
        </View>
      )}

      {floatingNotifications.map(renderFloatingNotification)}

      <View style={[styles.topPillContainer, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isCustomerConnected
                  ? "#4CAF50"
                  : "#F59E0B",
              },
            ]}
          />
          <Text style={styles.topPillTime}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {showChat && (
        <View
          style={[
            styles.chatPanel,
            {
              bottom: chatPanelBottom,
              maxHeight: keyboardVisible
                ? SCREEN_HEIGHT * 0.35
                : SCREEN_HEIGHT * 0.45,
            },
          ]}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderText}>Messages</Text>
            <TouchableOpacity
              onPress={() => setShowChat(false)}
              style={styles.closeChatButton}
            >
              <Ionicons
                name="close"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
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
            onContentSizeChange={() =>
              chatListRef.current?.scrollToEnd({ animated: false })
            }
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
                (!chatInput.trim() || isSendingMessage) &&
                  styles.chatSendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!keyboardVisible && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 15 }]}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.bottomGradient}
          >
            <View style={styles.interactionRow}>
              <TouchableOpacity
                style={[
                  styles.chatToggleButton,
                  showChat && styles.chatToggleButtonActive,
                ]}
                onPress={() => setShowChat(!showChat)}
              >
                <Ionicons name="chatbubbles" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.emojiContainer}>
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
            </View>
          </LinearGradient>
        </View>
      )}

      <CallEndedAlert
        visible={showAlert}
        message={alertMessage}
        onOk={() => {
          setShowAlert(false);
          cleanup();
          endCall();
          router.replace("/(tabs)/home");
        }}
      />
    </View>
  );
}

/* ===================== STYLES (UNCHANGED) ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  audioBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.6,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  mainAvatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    marginBottom: 25,
  },
  mainAvatar: { width: '100%', height: '100%', borderRadius: 80 },
  customerName: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  callStatusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 120,
    fontSize: 55,
    zIndex: 100,
  },
  floatingRight: { right: 30 },
  floatingLeft: { left: 30 },
  floatingMessageBubble: {
    position: 'absolute',
    bottom: 120,
    maxWidth: SCREEN_WIDTH * 0.65,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingMessageSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  floatingMessageText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },

  // Top Bar (Pill Style)
  topPillContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  topPillTime: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Local Video
  localVideoContainer: {
    position: 'absolute',
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#000',
    elevation: 5,
  },
  localVideo: { width: '100%', height: '100%' },
  chatPanel: {
    position: 'absolute',
    left: 15,
    right: 15,
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  closeChatButton: { padding: 4 },
  chatList: { maxHeight: SCREEN_HEIGHT * 0.28 },
  chatListContent: { padding: 16 },
  chatEmpty: { padding: 30, alignItems: 'center' },
  chatEmptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  chatBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 4,
  },
  chatBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: { color: 'white', fontSize: 15, lineHeight: 20 },
  chatBubbleTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomGradient: { paddingTop: 30, paddingBottom: 10 },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  chatToggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatToggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  emojiContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: { fontSize: 22 },
});
