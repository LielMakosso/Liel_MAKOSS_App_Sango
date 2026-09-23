import { io } from 'socket.io-client';

const SOCKET_URL = 'https://192.168.1.18:3000';

let socket = null;

export const socketService = {
  connect(token) {
    if (socket) return socket;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    return socket;
  },

  getSocket() {
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};