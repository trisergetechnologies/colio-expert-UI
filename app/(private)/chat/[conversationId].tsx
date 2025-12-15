// src/app/(private)/chat/[conversationId].tsx (Consultant App)
import { POLLING_INTERVALS } from '@/constants/chatConstants';
import { useAuth } from '@/context/AuthContext';
import {
  getMessages,
  markAsRead,
  Message,
  pollMessages,
  sendMessage,
  startConversation,
} from '@/services/chatApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Params validation
  const conversationIdParam = params.conversationId as string | undefined;
  const isValidConversationId =
    conversationIdParam &&
    conversationIdParam !== '[conversationId]' &&
    conversationIdParam.length === 24;

  const participantId = params.participantId as string;
  const participantName = params.participantName as string;
  const participantAvatar = params.participantAvatar as string;

  // State
  const [conversationId, setConversationId] = useState<string | null>(
    isValidConversationId ? conversationIdParam : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimeRef = useRef<string>(new Date().toISOString());

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShow.remove();
    };
  }, []);

  // Initialize chat
  useEffect(() => {
    initializeChat();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Start polling when conversationId is available
  useEffect(() => {
    if (conversationId && conversationId.length === 24) {
      startPolling();
      markAsRead(conversationId);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId]);

  const initializeChat = async () => {
    setIsLoading(true);

    try {
      let convId = isValidConversationId ? conversationIdParam : null;

      if (!convId && participantId) {
        console.log('[Consultant][Chat] Starting conversation with:', participantId);
        const conversation = await startConversation(participantId);
        if (conversation) {
          convId = conversation.id;
          setConversationId(convId);
        }
      }

      if (convId && convId.length === 24) {
        setConversationId(convId);
        await fetchMessages(convId, 1);
      } else {
        console.error('[Consultant][Chat] Invalid or missing conversationId');
      }
    } catch (error) {
      console.error('[Consultant][Chat] Initialize error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string, pageNum: number) => {
    if (!convId || convId.length !== 24) {
      console.error('[Consultant][Chat] Invalid convId:', convId);
      return;
    }

    try {
      const result = await getMessages(convId, pageNum, 50);

      if (pageNum === 1) {
        setMessages(result.messages);
      } else {
        setMessages(prev => [...result.messages, ...prev]);
      }

      setHasMore(result.pagination.hasMore);
      setPage(pageNum);

      if (result.messages.length > 0) {
        const latestMsg = result.messages[result.messages.length - 1];
        lastPollTimeRef.current = latestMsg.createdAt;
      }
    } catch (error) {
      console.error('[Consultant][Chat] Fetch messages error:', error);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    if (!conversationId || conversationId.length !== 24) {
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!conversationId || conversationId.length !== 24) return;

      try {
        const result = await pollMessages(conversationId, lastPollTimeRef.current);

        if (result.messages.length > 0) {
          setMessages(prev => [...prev, ...result.messages]);
          lastPollTimeRef.current = result.serverTime;
          markAsRead(conversationId);

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (error) {
        console.error('[Consultant][Chat] Poll error:', error);
      }
    }, POLLING_INTERVALS.CHAT_MESSAGES);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || conversationId.length !== 24 || isSending) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const newMessage = await sendMessage(conversationId, messageText, 'text');

      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
        lastPollTimeRef.current = newMessage.createdAt;

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('[Consultant][Chat] Send error:', error);
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !conversationId || conversationId.length !== 24) {
      return;
    }

    setIsLoadingMore(true);
    await fetchMessages(conversationId, page + 1);
    setIsLoadingMore(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    return (
      new Date(currentMsg.createdAt).toDateString() !==
      new Date(prevMsg.createdAt).toDateString()
    );
  };

  // ✅ FIX: Properly determine if message is from current user
  const isOwnMessage = (message: Message): boolean => {
    const currentUserId = user?.userId?.toString() || user?.userId?.toString() || '';
    const senderId = typeof message.sender === 'object' 
      ? (message.sender._id?.toString() || message.sender._id?.toString() || '')
      : message.sender?.toString() || '';
    
    return currentUserId === senderId;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = isOwnMessage(item);
    const prevMessage = index > 0 ? messages[index - 1] : undefined;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

    // Call log message - centered
    if (item.messageType === 'call_log') {
      return (
        <View>
          {showDateSeparator && (
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
          )}
          <View style={styles.callLogContainer}>
            <View style={styles.callLogBubble}>
              <Ionicons
                name={item.callLogData?.callType === 'video' ? 'videocam' : 'call'}
                size={16}
                color={
                  item.callLogData?.status === 'missed' ||
                  item.callLogData?.status === 'declined'
                    ? '#EF4444'
                    : '#22C55E'
                }
              />
              <Text style={styles.callLogText}>{item.content}</Text>
              <Text style={styles.callLogTime}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Regular message
    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubbleContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwn ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwn ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.8)']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  participantAvatar ||
                  'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.headerAvatar}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {participantName || 'Customer'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Messages + Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderHeader}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            inverted={false}
            onContentSizeChange={() => {
              if (messages.length > 0 && page === 1) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Input Container */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12 },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBubbleContainer: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: 'rgba(255,255,255,0.5)',
  },
  callLogContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  callLogBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  callLogText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  callLogTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: 'white',
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
});