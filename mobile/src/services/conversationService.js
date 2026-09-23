import api from './api';

export const conversationService = {
  async createPrivate(targetUserId) {
    const response = await api.post('/conversations/private', { targetUserId });
    return response.data.conversation;
  },

  async createGroup(name, memberIds) {
    const response = await api.post('/conversations/group', { name, memberIds });
    return response.data;
  },

  async listMine() {
    const response = await api.get('/conversations');
    return response.data.conversations;
  },

  async getOne(conversationId) {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  async markAsRead(conversationId) {
    const response = await api.put(`/conversations/${conversationId}/read`);
    return response.data;
  },
};