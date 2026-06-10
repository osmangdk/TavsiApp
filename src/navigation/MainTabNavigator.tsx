import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, PlusSquare, Users, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SearchScreen from '../screens/Search/SearchScreen';

// Placeholder screens for tabs not yet developed
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B' }}>{title} Ekranı</Text>
    <Text style={{ color: '#64748B', marginTop: 10 }}>Çok yakında...</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 85,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          const activeColor = '#7B2CBF';
          const inactiveColor = '#94A3B8';
          const iconColor = focused ? activeColor : inactiveColor;
          
          if (route.name === 'HomeTab') IconComponent = Home;
          else if (route.name === 'SearchTab') IconComponent = Search;
          else if (route.name === 'AddTab') IconComponent = PlusSquare;
          else if (route.name === 'NetworkTab') IconComponent = Users;
          else if (route.name === 'ProfileTab') IconComponent = User;
          
          return (
            <View style={{ alignItems: 'center' }}>
              <IconComponent size={26} color={iconColor} strokeWidth={focused ? 2.5 : 2} />
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
      <Tab.Screen name="AddTab" component={() => <PlaceholderScreen title="Tercih Ekle" />} />
      <Tab.Screen name="NetworkTab" component={() => <PlaceholderScreen title="Ağım" />} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
