import api from './api';

export const callHistoryService = {
  async getAll() {
    const response = await api.get('/calls');
    return response.data.calls;
  },

  async getByConversation(conversationId) {
    const response = await api.get(`/calls/${conversationId}`);
    return response.data.calls;
  },
};