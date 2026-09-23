import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { navigationRef } from '../navigation/navigationRef';

const IncomingCallContext = createContext();

export function IncomingCallProvider({ children }) {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    let socket = null;
    let retryInterval = null;
    let isMounted = true;

    const handleIncomingCall = (callData) => {
      console.log('[IncomingCallContext] Appel entrant reçu :', callData);
      setIncomingCall(callData);
    };

    const handleCallEnded = () => {
      console.log('[IncomingCallContext] Appel terminé par le serveur.');
      setIncomingCall(null);
    };

   const handleCallDeclined = () => {
      console.log('[IncomingCallContext] Appel refusé.');
      setIncomingCall(null);
    };

    const subscribeToEvents = () => {
      console.log('[IncomingCallContext] En écoute des appels entrants...');
      socket.on('incoming_call', handleIncomingCall);
      socket.on('call_ended', handleCallEnded);
      socket.on('call_declined', handleCallDeclined);
    };

    const setupSocket = () => {
      socket = socketService.getSocket();

      if (!socket) {
        console.log('[IncomingCallContext] Socket pas encore prêt, nouvelle tentative dans 500ms...');
        retryInterval = setTimeout(setupSocket, 500);
        return;
      }

      if (!socket.connected) {
        console.log('[IncomingCallContext] Socket existe mais pas connecté, attente...');
        socket.once('connect', () => {
          if (isMounted) {
            console.log('[IncomingCallContext] Socket maintenant connecté, on s\'abonne.');
            subscribeToEvents();
          }
        });
        return;
      }

      subscribeToEvents();
    };

    setupSocket();

    return () => {
      isMounted = false;
      if (retryInterval) clearTimeout(retryInterval);
      if (socket) {
        console.log('[IncomingCallContext] Arrêt de l\'écoute.');
        socket.off('incoming_call', handleIncomingCall);
        socket.off('call_ended', handleCallEnded);
        socket.off('call_declined', handleCallDeclined);
      }
    };
  }, []);

const acceptCall = () => {
    if (!incomingCall) return;

    console.log('[IncomingCallContext] Acceptation de l\'appel', incomingCall.callId);

    if (navigationRef.isReady()) {
      navigationRef.navigate('Call', {
        conversationId: incomingCall.conversationId,
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        isIncoming: true,
        offer: incomingCall.offer,
        otherUsername: incomingCall.callerUsername,
        targetUserId: incomingCall.callerId,
        autoAnswer: true,
      });
    }
  setIncomingCall(null);
  };
const declineCall = () => {
    if (!incomingCall) return;

    console.log('[IncomingCallContext] Refus de l\'appel', incomingCall.callId);

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('decline_call', {
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
      });
    }


    setIncomingCall(null);
  };

  return (
    <IncomingCallContext.Provider
      value={{
        incomingCall,
        setIncomingCall,
        acceptCall,
        declineCall,
      }}
    >
      {children}
    </IncomingCallContext.Provider>
  );
}

export function useIncomingCall() {
  return useContext(IncomingCallContext);
}