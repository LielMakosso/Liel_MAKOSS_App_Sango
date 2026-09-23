import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { View, Text, StyleSheet } from 'react-native';
import ConversationsScreen from '../screens/ConversationsScreen';
import CallsScreen from '../screens/CallsScreen';
import { useCalls } from '../context/CallsContext';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, badgeCount }) {
  return (
    <View>
      <Icon name={name} size={24} color={focused ? COLORS.primary : '#999'} />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function MainTabs() {
  const { missedCallsCount, unreadMessagesCount } = useCalls();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="DiscussionsTab"
        component={ConversationsScreen}
        options={{
          title: 'Discussions',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="message-circle" focused={focused} badgeCount={unreadMessagesCount} />
          ),
        }}
      />
      <Tab.Screen
        name="CallsTab"
        component={CallsScreen}
        options={{
          title: 'Appels',
          tabBarIcon: ({ focused }) => <TabIcon name="phone" focused={focused} badgeCount={missedCallsCount} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});