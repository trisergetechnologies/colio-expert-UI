// src/services/chatApi.ts
import { getToken } from '@/utils/tokenHelper';
import axios from 'axios';

const API_BASE_URL = 'https://api.colio.in/api';

// ============================================
// TYPES
// ============================================

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  availabilityStatus?: 'onWork' | 'offWork' | 'busy' | null;
}

export interface LastMessage {
  content: string;
  sender: string;
  messageType: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: Participant;
  lastMessage?: LastMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageSender {
  _id: string;
  name: string;
  avatar?: string;
}

export interface CallLogData {
  sessionId: string;
  callType: 'voice' | 'video';
  duration: number;
  status: 'missed' | 'completed' | 'declined' | 'busy' | 'no_answer';
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: MessageSender;
  receiver: string;
  content: string;
  messageType: 'text' | 'emoji' | 'call_log';
  callLogData?: CallLogData;
  duringCall: boolean;
  sessionId?: string;
  readAt?: string;
  createdAt: string;
  formattedDuration?: string;
  isCallLog?: boolean;
  isMissedCall?: boolean;
}

export interface CallEmoji {
  emoji: string;
  senderId: string;
  senderType: 'customer' | 'consultant';
  timestamp: number;
}

export interface PollCallEmojisResult {
  emojis: CallEmoji[];
  serverTime: number;
  sessionInactive?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ============================================
// HELPER
// ============================================

const getAuthHeaders = async () => {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
};

// ============================================
// CONVERSATION APIs
// ============================================

/**
 * Get all conversations for current user
 */
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/chat/conversations`, { headers });

    if (res.data.success) {
      return res.data.data.conversations;
    }
    return [];
  } catch (error) {
    console.error('[chatApi] getConversations error:', error);
    return [];
  }
};

/**
 * Start or get existing conversation with a user
 */
export const startConversation = async (participantId: string): Promise<Conversation | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/start`,
      { participantId },
      { headers }
    );

    if (res.data.success) {
      return res.data.data.conversation;
    }
    return null;
  } catch (error) {
    console.error('[chatApi] startConversation error:', error);
    return null;
  }
};

/**
 * Get single conversation details
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}`,
      { headers }
    );

    if (res.data.success) {
      return res.data.data.conversation;
    }
    return null;
  } catch (error) {
    console.error('[chatApi] getConversation error:', error);
    return null;
  }
};

/**
 * Get messages for a conversation (paginated)
 */
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; pagination: PaginationInfo }> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      {
        headers,
        params: { page, limit }
      }
    );

    if (res.data.success) {
      return {
        messages: res.data.data.messages,
        pagination: res.data.data.pagination
      };
    }
    return { messages: [], pagination: { page: 1, limit: 50, total: 0, hasMore: false } };
  } catch (error) {
    console.error('[chatApi] getMessages error:', error);
    return { messages: [], pagination: { page: 1, limit: 50, total: 0, hasMore: false } };
  }
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  messageType: 'text' | 'emoji' = 'text'
): Promise<Message | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      { content, messageType },
      { headers }
    );

    if (res.data.success) {
      return res.data.data.message;
    }
    return null;
  } catch (error) {
    console.error('[chatApi] sendMessage error:', error);
    return null;
  }
};

/**
 * Mark conversation as read
 */
export const markAsRead = async (conversationId: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.put(
      `${API_BASE_URL}/chat/conversations/${conversationId}/read`,
      {},
      { headers }
    );

    return res.data.success;
  } catch (error) {
    console.error('[chatApi] markAsRead error:', error);
    return false;
  }
};

/**
 * Poll for new messages since a timestamp
 */
export const pollMessages = async (
  conversationId: string,
  since: string
): Promise<{ messages: Message[]; serverTime: string }> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}/poll`,
      {
        headers,
        params: { since }
      }
    );

    if (res.data.success) {
      return {
        messages: res.data.data.messages,
        serverTime: res.data.data.serverTime
      };
    }
    return { messages: [], serverTime: new Date().toISOString() };
  } catch (error) {
    console.error('[chatApi] pollMessages error:', error);
    return { messages: [], serverTime: new Date().toISOString() };
  }
};

/**
 * Get total unread count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/chat/unread-count`, { headers });

    if (res.data.success) {
      return res.data.data.unreadCount;
    }
    return 0;
  } catch (error) {
    console.error('[chatApi] getUnreadCount error:', error);
    return 0;
  }
};

// ============================================
// IN-CALL CHAT APIs
// ============================================

/**
 * Send message during active call
 */
export const sendInCallMessage = async (
  sessionId: string,
  content: string,
  messageType: 'text' | 'emoji' = 'text'
): Promise<{ message: Message; conversationId: string } | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/chat/call/${sessionId}/message`,
      { content, messageType },
      { headers }
    );

    if (res.data.success) {
      return {
        message: res.data.data.message,
        conversationId: res.data.data.conversationId
      };
    }
    return null;
  } catch (error) {
    console.error('[chatApi] sendInCallMessage error:', error);
    return null;
  }
};

/**
 * Get messages for active call session
 */
export const getInCallMessages = async (
  sessionId: string,
  since?: string
): Promise<{ messages: Message[]; serverTime: string }> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/chat/call/${sessionId}/messages`,
      {
        headers,
        params: since ? { since } : {}
      }
    );

    if (res.data.success) {
      return {
        messages: res.data.data.messages,
        serverTime: res.data.data.serverTime
      };
    }
    return { messages: [], serverTime: new Date().toISOString() };
  } catch (error) {
    console.error('[chatApi] getInCallMessages error:', error);
    return { messages: [], serverTime: new Date().toISOString() };
  }
};

/**
 * Send emoji reaction during call
 */
export const sendCallEmoji = async (
  sessionId: string,
  emoji: string
): Promise<CallEmoji | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/chat/call/${sessionId}/emoji`,
      { emoji },
      { headers }
    );

    if (res.data.success) {
      return res.data.data.emoji;
    }
    return null;
  } catch (error) {
    console.error('[chatApi] sendCallEmoji error:', error);
    return null;
  }
};

/**
 * Poll for emoji reactions during call
 */
export const pollCallEmojis = async (
  sessionId: string,
  since?: number
): Promise<PollCallEmojisResult> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/chat/call/${sessionId}/emoji/poll`,
      {
        headers,
        params: since ? { since } : {}
      }
    );

    if (res.data.success) {
      return {
        emojis: res.data.data.emojis,
        serverTime: res.data.data.serverTime
      };
    }
    return { emojis: [], serverTime: Date.now() };
  } catch (error: any) {
    // 404 is expected when session is no longer active; stop polling gracefully.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { emojis: [], serverTime: Date.now(), sessionInactive: true };
    }
    console.error('[chatApi] pollCallEmojis error:', error);
    return { emojis: [], serverTime: Date.now() };
  }
};

// ============================================
// EXPORT DEFAULT OBJECT (optional)
// ============================================

export default {
  // Conversations
  getConversations,
  startConversation,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  pollMessages,
  getUnreadCount,
  // In-call
  sendInCallMessage,
  getInCallMessages,
  sendCallEmoji,
  pollCallEmojis
};