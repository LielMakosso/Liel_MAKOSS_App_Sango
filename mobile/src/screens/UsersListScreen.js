import React, { useEffect, useState, useCallback } from 'react';
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
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { conversationService } from '../services/conversationService';
import { COLORS } from '../theme/colors';

export default function UsersListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const { logout, user } = useAuth();

  const loadUsers = useCallback(async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleUserPress = async (item) => {
    if (creatingChat) return;
    setCreatingChat(true);
    try {
      const conversation = await conversationService.createPrivate(item.id);
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUsername: item.username,
        targetUserId: item.id,
        otherStatus: item.status,
        isGroup: false,
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    } finally {
      setCreatingChat(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
      disabled={creatingChat}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={[styles.statusDot, item.status === 'online' && styles.online]} />
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun autre utilisateur pour le moment</Text>
        }
      />

      {creatingChat && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
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
  logoutText: { color: COLORS.danger, fontWeight: '600' },
  userItem: {
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
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: '600' },
  email: { fontSize: 13, color: '#777' },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  online: { backgroundColor: COLORS.primary },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});