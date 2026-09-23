import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { messageService } from '../services/messageService';
import { fileService } from '../services/fileService';
import { socketService } from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherUsername, targetUserId, otherStatus, isGroup } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.headerName}>{otherUsername || 'Conversation'}</Text>
          {!isGroup && (
            <Text style={styles.headerStatus}>
              {otherStatus === 'online' ? 'En ligne' : 'Hors ligne'}
            </Text>
          )}
        </View>
      ),
      headerRight: () =>
        !isGroup && (
          <View style={{ flexDirection: 'row', gap: 20, marginRight: 15 }}>
            <TouchableOpacity onPress={() => startCall('audio')}>
              <Icon name="phone" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => startCall('video')}>
              <Icon name="video" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ),
    });

    loadHistory();

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_conversation', conversationId);
      socket.on('new_message', handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.emit('leave_conversation', conversationId);
      }
    };
  }, [conversationId]);

  const startCall = (callType) => {
    navigation.navigate('Call', {
      conversationId,
      targetUserId,
      callType,
      isIncoming: false,
      otherUsername,
    });
  };

  const handleNewMessage = (message) => {
    if (Number(message.conversation_id) === Number(conversationId)) {
      setMessages((prev) => [...prev, message]);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await messageService.getHistory(conversationId);
      setMessages(history);
    } catch (err) {
      console.log('Erreur chargement historique', err.message);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('send_message', { conversationId, content: text.trim() });
    }
    setText('');
  };

  const sendFileMessage = (file) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('send_message', { conversationId, fileId: file.id });
    }
  };

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'mixed', quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset) return;

      setUploading(true);
      try {
        const file = await fileService.upload({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        });
        sendFileMessage(file);
      } catch (err) {
        Alert.alert('Erreur', 'Échec de l\'envoi du fichier');
      } finally {
        setUploading(false);
      }
    });
  };

  const handlePickDocument = async () => {
    try {
      const [result] = await pick({ type: ['*/*'] });
      setUploading(true);
      const file = await fileService.upload({
        uri: result.uri,
        type: result.type,
        fileName: result.name,
      });
      sendFileMessage(file);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      } else {
        Alert.alert('Erreur', 'Échec de l\'envoi du document');
      }
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.sender_id === user.id;
    const isImage = item.file_type?.startsWith('image/');
    const hasFile = !!item.file_url;

    return (
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
        {!isMine && <Text style={styles.senderName}>{item.sender_username}</Text>}

        {hasFile && isImage && (
          <Image source={{ uri: item.file_url }} style={styles.imagePreview} resizeMode="cover" />
        )}

        {hasFile && !isImage && (
          <TouchableOpacity onPress={() => Linking.openURL(item.file_url)} style={styles.fileBox}>
            <Icon name="file" size={18} color="#555" style={{ marginRight: 8 }} />
            <Text style={styles.fileName} numberOfLines={1}>{item.file_name}</Text>
          </TouchableOpacity>
        )}

        {item.content && (
          <Text style={isMine ? styles.myText : styles.otherText}>{item.content}</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {uploading && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.uploadingText}>Envoi en cours...</Text>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
          <Icon name="image" size={22} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument}>
          <Icon name="paperclip" size={22} color="#555" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Écris un message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Icon name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.chatBackground },
  list: { padding: 12 },
  headerName: { fontSize: 17, fontWeight: '600' },
  headerStatus: { fontSize: 12, color: COLORS.textLight },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  myBubble: { backgroundColor: COLORS.primaryLight, alignSelf: 'flex-end' },
  otherBubble: { backgroundColor: '#fff', alignSelf: 'flex-start' },
  senderName: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  myText: { fontSize: 15, color: '#000' },
  otherText: { fontSize: 15, color: '#000' },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 6,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  fileName: { flex: 1, fontSize: 14 },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
  uploadingText: { marginLeft: 8, color: '#666' },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  attachButton: { padding: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});