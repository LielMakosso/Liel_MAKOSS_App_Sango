import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

const CallsContext = createContext();

export function CallsProvider({ children }) {
  const [missedCallsCount, setMissedCallsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleMissedCall = () => {
      setMissedCallsCount((prev) => prev + 1);
    };

    socket.on('call_missed', handleMissedCall);

    return () => {
      socket.off('call_missed', handleMissedCall);
    };
  }, []);

  const clearMissedCalls = () => setMissedCallsCount(0);

  return (
    <CallsContext.Provider
      value={{
        missedCallsCount,
        clearMissedCalls,
        setMissedCallsCount,
        unreadMessagesCount,
        setUnreadMessagesCount,
      }}
    >
      {children}
    </CallsContext.Provider>
  );
}

export function useCalls() {
  return useContext(CallsContext);
}