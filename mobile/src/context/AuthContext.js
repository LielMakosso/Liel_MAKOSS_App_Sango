import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../services/socketService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        socketService.connect(storedToken);
      }
    } catch (err) {
      console.error('Erreur chargement auth stockée:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    await AsyncStorage.setItem('token', userToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    socketService.connect(userToken);
  };

  const logout = async () => {
    socketService.disconnect();
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}