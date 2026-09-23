import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useIncomingCall } from '../context/IncomingCallContext';
import { COLORS } from '../theme/colors';

export default function IncomingCallBanner() {
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const insets = useSafeAreaInsets();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'video';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.info}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(incomingCall.callerUsername || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{incomingCall.callerUsername}</Text>
          <Text style={styles.subtitle}>
            {isVideo ? 'Appel vidéo entrant...' : 'Appel entrant...'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={declineCall}
        >
          <Icon name="phone-off" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={acceptCall}
        >
          <Icon name={isVideo ? 'video' : 'phone'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  subtitle: { color: '#ccc', fontSize: 12, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  declineBtn: { backgroundColor: COLORS.danger },
  acceptBtn: { backgroundColor: '#25D366' },
});