import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Alert } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/Feather';
import callService from '../services/callService';
import { socketService } from '../services/socketService';
import { COLORS } from '../theme/colors';

export default function CallScreen({ route, navigation }) {
  const {
    conversationId,
    targetUserId,
    callType,
    isIncoming,
    offer,
    callId,
    otherUsername,
    callerUsername,
    autoAnswer,
  } = route.params || {};

  const displayName = otherUsername || callerUsername || 'Correspondant';
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Connexion...');
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(callType === 'video');
  const [duration, setDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);
  const [endedMessage, setEndedMessage] = useState('Appel terminé');

  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const socketRef = useRef(socketService.getSocket());

  const formatDuration = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const endAndExit = (message) => {
    stopTimer();
    setEndedMessage(message);
    setCallEnded(true);
    setTimeout(() => navigation.goBack(), 1500);
  };


  useEffect(() => {
    const socket = socketRef.current;


    callService.on('remoteStream', (stream) => {
      console.log('[CallScreen] remoteStream reçu');
      setRemoteStream(stream);
      setStatus('Connecté');
      startTimer();
    });


    if (socket) {
      socket.emit('join_conversation', conversationId);
    }


    if (!isIncoming && !hasStartedRef.current) {

      hasStartedRef.current = true;
      initiateCall();
    } else if (isIncoming && autoAnswer && !hasStartedRef.current) {

      hasStartedRef.current = true;
      handleAccept();
    }

    if (socket) {
      socket.on('call_answered', async ({ answer }) => {
        console.log('[CallScreen] call_answered reçu');
        await callService.handleAnswer(answer);
      });

      socket.on('ice_candidate', async ({ candidate }) => {
        await callService.addIceCandidate(candidate);
      });

      socket.on('call_declined', () => {
        endAndExit('Appel refusé');
      });

      socket.on('call_ended', () => {
        endAndExit('Appel terminé');
      });
    }


    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleHangUp();
      return true;
    });

    return () => {
      stopTimer();
      if (socket) {
        socket.off('call_answered');
        socket.off('ice_candidate');
        socket.off('call_declined');
        socket.off('call_ended');
      }
      backHandler.remove();
    };
  }, []);


  const requestCallPermissions = async () => {
    const { PermissionsAndroid, Platform } = require('react-native');
    if (Platform.OS !== 'android') return true;

    try {
      const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (callType === 'video') {
        permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      const results = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(results).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert(
          'Permissions requises',
          'Le micro (et la caméra pour un appel vidéo) doivent être autorisés.'
        );
        return false;
      }
      return true;
    } catch (err) {
      console.log('Erreur demande permissions appel', err);
      return false;
    }
  };


  const initiateCall = async () => {
    const granted = await requestCallPermissions();
    if (!granted) {
      navigation.goBack();
      return;
    }
    try {
      await callService.startCall(conversationId, targetUserId, callType);
      setLocalStream(callService.localStream);
      setStatus('Appel en cours...');
    } catch (err) {
      console.error('Erreur initiation appel:', err);
      endAndExit('Erreur lors de l\'appel');
    }
  };


  const handleAccept = async () => {
    const granted = await requestCallPermissions();
    if (!granted) {
      handleDecline();
      return;
    }
    try {
      await callService.answerCall(conversationId, callId, offer, callType);
      setLocalStream(callService.localStream);
      setStatus('Connexion...');
    } catch (err) {
      console.error('Erreur acceptation appel:', err);
      Alert.alert('Erreur', 'Impossible de répondre à cet appel : ' + err.message);
      handleDecline();
    }
  };


  const handleDecline = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('decline_call', { callId, conversationId });
    }
    navigation.goBack();
  };


  const handleHangUp = () => {
    callService.endCall();
    endAndExit('Appel terminé');
  };

  const handleToggleMute = () => setMuted(callService.toggleMute());
  const handleToggleSpeaker = () => setSpeakerOn(callService.toggleSpeaker());


  if (callEnded) {
    return (
      <View style={styles.endedContainer}>
        <View style={styles.endedIconWrapper}>
          <Icon name="phone-off" size={36} color="#fff" />
        </View>
        <Text style={styles.endedText}>{endedMessage}</Text>
      </View>
    );
  }

  const showIncomingUI = isIncoming && !localStream && !autoAnswer;

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
        ) : (
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.status}>{status}</Text>
            {remoteStream === null && localStream && (
              <Text style={styles.waitingText}>En attente de connexion...</Text>
            )}
          </View>
        )}

        {localStream && callType === 'video' && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" mirror />
        )}
      </View>

      {remoteStream && (
        <View style={styles.nameOverlay}>
          <Text style={styles.nameOverlayText}>{displayName}</Text>
          <Text style={styles.statusOverlayText}>{formatDuration(duration)}</Text>
        </View>
      )}

      <View style={styles.controls}>
        {showIncomingUI ? (

          <View style={styles.incomingRow}>
            <TouchableOpacity style={[styles.circleButton, styles.declineButton]} onPress={handleDecline}>
              <Icon name="phone-off" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.acceptButton]} onPress={handleAccept}>
              <Icon name="phone" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={styles.smallButton} onPress={handleToggleMute}>
                <Icon name={muted ? 'mic-off' : 'mic'} size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleToggleSpeaker}>
                <Icon name={speakerOn ? 'volume-2' : 'volume-x'} size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => Alert.alert('Bientôt disponible')}>
                <Icon name="user-plus" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.circleButton, styles.hangupButton]} onPress={handleHangUp}>
              <Icon name="phone-off" size={26} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A', justifyContent: 'space-between' },
  videoContainer: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1 },
  avatarWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 22, fontWeight: '600', marginBottom: 6 },
  status: { color: '#ccc', fontSize: 15 },
  waitingText: { color: '#999', fontSize: 13, marginTop: 10 },
  localVideo: {
    position: 'absolute', width: 110, height: 150, top: 20, right: 20,
    borderRadius: 8, borderWidth: 2, borderColor: '#fff',
  },
  nameOverlay: { position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center' },
  nameOverlayText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  statusOverlayText: { color: '#ddd', fontSize: 13, marginTop: 2 },
  controls: { alignItems: 'center', paddingBottom: 40, paddingTop: 10 },
  incomingRow: { flexDirection: 'row', justifyContent: 'center', gap: 40 },
  secondaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 24 },
  smallButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  circleButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  acceptButton: { backgroundColor: COLORS.primary },
  declineButton: { backgroundColor: COLORS.danger },
  hangupButton: { backgroundColor: COLORS.danger },
  endedContainer: { flex: 1, backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center' },
  endedIconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  endedText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});