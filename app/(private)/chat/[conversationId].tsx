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
import { useEffect, useRef, useState } from 'react';
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

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const conversationIdParam = params.conversationId as string | undefined;
  const participantId = params.participantId as string;
  const participantName = params.participantName as string;
  const participantAvatar = params.participantAvatar as string;

  const [conversationId, setConversationId] = useState<string | null>(conversationIdParam || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimeRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    initializeChat();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
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
      let convId = conversationIdParam;

      if (!convId && participantId) {
        const conversation = await startConversation(participantId);
        if (conversation) {
          convId = conversation.id;
          setConversationId(convId);
        }
      }

      if (convId) {
        setConversationId(convId);
        await fetchMessages(convId, 1);
      }
    } catch (error) {
      console.error('[Consultant][Chat] Initialize error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string, pageNum: number) => {
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
      console.error('[Consultant][Chat] Fetch error:', error);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!conversationId) return;

      try {
        const result = await pollMessages(conversationId, lastPollTimeRef.current);

        if (result.messages.length > 0) {
          setMessages(prev => [...prev, ...result.messages]);
          lastPollTimeRef.current = result.serverTime;
          markAsRead(conversationId);
        }
      } catch (error) {
        console.error('[Consultant][Chat] Poll error:', error);
      }
    }, POLLING_INTERVALS.CHAT_MESSAGES);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    Keyboard.dismiss();

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
    if (isLoadingMore || !hasMore || !conversationId) return;

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

    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();

    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender._id === user?._id;
    const prevMessage = index > 0 ? messages[index - 1] : undefined;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

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
                color={item.isMissedCall ? '#EF4444' : '#4CAF50'}
              />
              <Text style={styles.callLogText}>{item.content}</Text>
              <Text style={styles.callLogTime}>{formatMessageTime(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      );
    }

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
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Image
            source={{
              uri: participantAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {participantName}
            </Text>
            <Text style={styles.headerStatus}>Customer</Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </LinearGradient>

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
        />
      )}

      <View style={styles.inputContainer}>
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
    paddingTop: 50,
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
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
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