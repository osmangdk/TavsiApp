import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Plus, Users, User } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import AddPreferenceScreen from '../screens/Add/AddPreferenceScreen';
import NetworkScreen from '../screens/Network/NetworkScreen';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.headerBg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarIcon: ({ focused }) => {
          const activeColor = colors.primary;
          const inactiveColor = colors.mutedText;

          if (route.name === 'AddTab') {
            return (
              <View style={[styles.floatingAddBtn, { backgroundColor: colors.primary }]}>
                <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            );
          }

          let IconComponent;
          if (route.name === 'HomeTab') IconComponent = Home;
          else if (route.name === 'SearchTab') IconComponent = Search;
          else if (route.name === 'NetworkTab') IconComponent = Users;
          else if (route.name === 'ProfileTab') IconComponent = User;
          else IconComponent = Home;

          const iconColor = focused ? activeColor : inactiveColor;

          return (
            <View style={{ alignItems: 'center' }}>
              <IconComponent size={24} color={iconColor} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: activeColor, marginTop: 4 }} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="AddTab" component={AddPreferenceScreen} />
      <Tab.Screen name="NetworkTab" component={NetworkScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
