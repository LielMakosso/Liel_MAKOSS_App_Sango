import React, { useState, useCallback, useEffect } from 'react';
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
import { conversationService } from '../services/conversationService';
import { socketService } from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { useCalls } from '../context/CallsContext';
import { COLORS } from '../theme/colors';

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();
  const { setMissedCallsCount, setUnreadMessagesCount } = useCalls();

  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationService.listMine();
      setConversations(data);

      const missedCount = data.filter((c) => !!c.missed_call_id).length;
      setMissedCallsCount(missedCount);

      const totalUnread = data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setMissedCallsCount, setUnreadMessagesCount]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConversationUpdated = () => {
      loadConversations();
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('call_missed', handleConversationUpdated);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('call_missed', handleConversationUpdated);
    };
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Veux-tu vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  const openConversation = async (item, displayName) => {
    try {
      await conversationService.markAsRead(item.id);
    } catch (err) {
      // silencieux
    }
    navigation.navigate('Chat', {
      conversationId: item.id,
      otherUsername: displayName,
      targetUserId: item.type === 'private' ? item.other_user_id : null,
      otherStatus: item.other_status,
      isGroup: item.type === 'group',
    });
  };

  const renderItem = ({ item }) => {
    const displayName = item.type === 'group' ? item.name : (item.other_username || 'Utilisateur');
    const isOnline = item.type === 'private' && item.other_status === 'online';
    const unreadCount = Number(item.unread_count) || 0;
    const hasMissedCall = !!item.missed_call_id;

    let previewText = 'Aucun message';
    if (hasMissedCall) {
      previewText = item.missed_call_type === 'video' ? 'Appel vidéo manqué' : 'Appel manqué';
    } else if (item.last_message_content) {
      previewText = item.last_message_content;
    } else if (item.last_message_at) {
      previewText = 'Pièce jointe';
    }

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => openConversation(item, displayName)}
      >
        <View style={[styles.avatar, item.type === 'group' && styles.groupAvatar]}>
          <Text style={styles.avatarText}>
            {item.type === 'group' ? '👥' : displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, unreadCount > 0 && styles.titleUnread]}>{displayName}</Text>
          <View style={styles.subtitleRow}>
            {hasMissedCall && <Icon name="phone-missed" size={13} color={COLORS.danger} style={styles.missedIcon} />}
            <Text
              style={[
                styles.subtitle,
                hasMissedCall && styles.subtitleMissed,
                unreadCount > 0 && !hasMissedCall && styles.subtitleUnread,
              ]}
              numberOfLines={1}
            >
              {previewText}
            </Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Discussions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('NewGroup')}>
            <Text style={styles.actionText}>+ Groupe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('UsersList')}>
            <Text style={styles.actionText}>+ Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
            <Icon name="log-out" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune conversation pour le moment.{'\n'}Clique sur "+ Chat" pour commencer.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionText: { color: COLORS.primary, fontWeight: '600', marginLeft: 12 },
  logoutIconBtn: { marginLeft: 12, padding: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupAvatar: { backgroundColor: COLORS.primaryDark },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  titleUnread: { fontWeight: 'bold' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  missedIcon: { marginRight: 4 },
  subtitle: { fontSize: 13, color: '#777', flex: 1 },
  subtitleMissed: { color: COLORS.danger },
  subtitleUnread: { color: '#333', fontWeight: '600' },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', paddingHorizontal: 30 },
});