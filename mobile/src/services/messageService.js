import api from './api';

export const messageService = {
  async send(conversationId, content, fileId = null) {
    const response = await api.post('/messages', { conversationId, content, fileId });
    return response.data.message;
  },

  async getHistory(conversationId) {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data.messages;
  },
};