// hooks/useIncomingCallPolling.ts (Consultant App)
import { getToken } from '@/utils/tokenHelper';
import axios from 'axios';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'https://api.colio.in/api';
const POLL_INTERVAL = 3000;

interface IncomingCall {
  sessionId: string;
  callType: 'voice' | 'video';
  channelName: string;
  customerName: string;
  customerAvatar: string;
  customerId: string;
  createdAt: string;
  ratePerMinute: number;
}

export function useIncomingCallPolling() {
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false); // ✅ Prevent duplicate navigation
  const lastCallIdRef = useRef<string | null>(null);

  const pollForCalls = async () => {
    try {
      // ✅ Don't poll if navigating or on call screens
      if (isNavigatingRef.current) {
        console.log('[Consultant] Currently navigating - skip poll');
        return;
      }

      if (pathname === '/incoming-call' || pathname === '/call') {
        console.log('[Consultant] On call screen - skip poll');
        return;
      }

      const jwt = await getToken();
      if (!jwt) return;

      const res = await axios.get(
        `${API_BASE_URL}/communication/incoming-calls`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (res.data.success && res.data.data.incomingCalls) {
        const calls = res.data.data.incomingCalls as IncomingCall[];
        setIncomingCalls(calls);

        if (calls.length > 0 && !isNavigatingRef.current) {
          const latestCall = calls[0];
          
          // Only navigate if it's a NEW call
          if (latestCall.sessionId !== lastCallIdRef.current) {
            console.log('[Consultant] 🔔 New incoming call detected!');
            
            // ✅ STOP POLLING IMMEDIATELY
            isNavigatingRef.current = true;
            lastCallIdRef.current = latestCall.sessionId;
            stopPolling();
            
            router.push({
              pathname: '/(private)/incoming-call',
              params: {
                sessionId: latestCall.sessionId,
                callType: latestCall.callType,
                customerName: latestCall.customerName,
                customerAvatar: latestCall.customerAvatar,
                channelName: latestCall.channelName,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('[Consultant] Polling error:', error);
    }
  };

  const startPolling = () => {
    if (isPolling) {
      console.log('[Consultant] Already polling');
      return;
    }

    console.log('[Consultant] 🔄 Started polling for incoming calls');
    setIsPolling(true);
    isNavigatingRef.current = false; // ✅ Reset navigation flag
    
    pollForCalls();
    intervalRef.current = setInterval(pollForCalls, POLL_INTERVAL);
  };

  const stopPolling = () => {
    console.log('[Consultant] ⏸ Stopped polling');
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetPolling = () => {
    console.log('[Consultant] 🔄 Resetting polling state');
    isNavigatingRef.current = false;
    lastCallIdRef.current = null;
    setIncomingCalls([]);
    startPolling();
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    incomingCalls,
    isPolling,
    startPolling,
    stopPolling,
    resetPolling, // ✅ Expose reset function
  };
}