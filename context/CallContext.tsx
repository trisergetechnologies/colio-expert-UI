// context/CallContext.tsx (Consultant App)
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface CallContextType {
  isInCall: boolean;
  currentSessionId: string | null;
  startCall: (sessionId: string) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startCall = (sessionId: string) => {
    console.log('[CallContext] Call started:', sessionId);
    setIsInCall(true);
    setCurrentSessionId(sessionId);
  };

  const endCall = () => {
    console.log('[CallContext] Call ended');
    setIsInCall(false);
    setCurrentSessionId(null);
  };

  return (
    <CallContext.Provider value={{ isInCall, currentSessionId, startCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within CallProvider');
  }
  return context;
}