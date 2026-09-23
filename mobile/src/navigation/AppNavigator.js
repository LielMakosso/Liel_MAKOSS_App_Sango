import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CallsProvider } from '../context/CallsContext';
import { IncomingCallProvider } from '../context/IncomingCallContext';
import { navigationRef } from './navigationRef';
import IncomingCallBanner from '../components/IncomingCallBanner';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UsersListScreen from '../screens/UsersListScreen';
import ChatScreen from '../screens/ChatScreen';
import NewGroupScreen from '../screens/NewGroupScreen';
import CallScreen from '../screens/CallScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? (
        <CallsProvider>
          <IncomingCallProvider>
            <View style={{ flex: 1 }}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="UsersList" component={UsersListScreen} />
                <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ headerShown: true, title: 'Nouveau groupe' }} />
                <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true }} />
                <Stack.Screen name="Call" component={CallScreen} />
              </Stack.Navigator>
              <IncomingCallBanner />
            </View>
          </IncomingCallProvider>
        </CallsProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}