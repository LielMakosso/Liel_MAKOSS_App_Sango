import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { userService } from '../services/userService';
import { conversationService } from '../services/conversationService';
import { COLORS } from '../theme/colors';

export default function NewGroupScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Erreur', 'Merci de donner un nom au groupe');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Sélectionne au moins un membre');
      return;
    }

    setCreating(true);
    try {
      const data = await conversationService.createGroup(groupName.trim(), selectedIds);
      navigation.navigate('Chat', {
        conversationId: data.conversation.id,
        otherUsername: groupName.trim(),
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer le groupe');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }) => {
    const selected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => toggleSelect(item.id)}>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.username}>{item.username}</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Nom du groupe"
        value={groupName}
        onChangeText={setGroupName}
      />

      <Text style={styles.label}>Sélectionne les membres :</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Créer le groupe</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  label: { fontSize: 14, color: '#777', marginBottom: 8 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: COLORS.primary },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  username: { fontSize: 16 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});