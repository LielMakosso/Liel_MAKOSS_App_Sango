import api from './api';

export const userService = {
  async listUsers() {
    const response = await api.get('/users');
    return response.data.users;
  },
};