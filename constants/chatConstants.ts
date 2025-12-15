// src/constants/chatConstants.ts

/**
 * Emojis available during video/voice calls
 * These are sent in real-time and displayed as floating animations
 */
export const CALL_EMOJIS = [
  '❤️',  // Love
  '👍',  // Thumbs up
  '😂',  // Laughing
  '🎉',  // Celebration
  '🔥',  // Fire
  '😍',  // Heart eyes
  '👋',  // Wave
  '🙏',  // Thank you / Namaste
  '😊',  // Smiling
  '💯'   // 100 / Perfect
];

/**
 * Message types supported in chat
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  EMOJI: 'emoji',
  CALL_LOG: 'call_log'
} as const;

/**
 * Call log statuses for chat messages
 */
export const CALL_LOG_STATUS = {
  COMPLETED: 'completed',
  MISSED: 'missed',
  DECLINED: 'declined',
  BUSY: 'busy',
  NO_ANSWER: 'no_answer'
} as const;

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
  CHAT_MESSAGES: 3000,      // 3 seconds for regular chat
  IN_CALL_MESSAGES: 2000,   // 2 seconds during active call
  IN_CALL_EMOJIS: 1000      // 1 second for emoji reactions
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

/**
 * Format call duration for display
 */
export const formatCallDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if emoji is valid for calls
 */
export const isValidCallEmoji = (emoji: string): boolean => {
  return CALL_EMOJIS.includes(emoji);
};

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type CallLogStatus = typeof CALL_LOG_STATUS[keyof typeof CALL_LOG_STATUS];