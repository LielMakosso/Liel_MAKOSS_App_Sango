import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { callHistoryService } from '../services/callHistoryService';
import { useAuth } from '../context/AuthContext';
import { useCalls } from '../context/CallsContext';
import { COLORS } from '../theme/colors';

export default function CallsScreen({ navigation }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { clearMissedCalls } = useCalls();

  const loadCalls = useCallback(async () => {
    try {
      const data = await callHistoryService.getAll();
      setCalls(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger l\'historique des appels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCalls();
      clearMissedCalls();
    }, [loadCalls])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCalls();
  };

  const startCall = (item, callType) => {
    navigation.navigate('Call', {
      conversationId: item.conversation_id,
      targetUserId: item.other_user_id,
      callType,
      isIncoming: false,
      otherUsername: item.other_username,
    });
  };

  const renderItem = ({ item }) => {
    const isMissed = item.last_call_status === 'missed' && item.last_call_caller_id !== user.id;
    const wasOutgoing = item.last_call_caller_id === user.id;
    const callIcon = item.last_call_type === 'video' ? 'video' : 'phone';

    let directionLabel = '';
    if (wasOutgoing) directionLabel = 'Sortant';
    else if (isMissed) directionLabel = 'Manqué';
    else directionLabel = 'Entrant';

    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={styles.itemMain}
          onPress={() =>
            navigation.navigate('Chat', {
              conversationId: item.conversation_id,
              otherUsername: item.other_username,
              targetUserId: item.other_user_id,
            })
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.other_username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, isMissed && styles.nameMissed]}>{item.other_username}</Text>
            <View style={styles.detailRow}>
              <Icon
                name={callIcon}
                size={13}
                color={isMissed ? COLORS.danger : '#777'}
                style={styles.detailIcon}
              />
              <Text style={[styles.detail, isMissed && styles.detailMissed]}>
                {directionLabel} · {item.total_calls} appel{item.total_calls > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.callButtons}>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall(item, 'audio')}>
            <Icon name="phone" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall(item, 'video')}>
            <Icon name="video" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appels</Text>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => item.conversation_id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun appel pour le moment.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  nameMissed: { color: COLORS.danger },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailIcon: { marginRight: 4 },
  detail: { fontSize: 13, color: '#777' },
  detailMissed: { color: COLORS.danger },
  callButtons: { flexDirection: 'row', gap: 8 },
  callBtn: { padding: 8, marginLeft: 4 },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', paddingHorizontal: 30 },
});