import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import HowItWorksScreen from '../screens/Onboarding/HowItWorksScreen';
import PrivacyScreen from '../screens/Onboarding/PrivacyScreen';
import AuthOptionsScreen from '../screens/Auth/AuthOptionsScreen';
import PhoneInputScreen from '../screens/Auth/PhoneInputScreen';
import SmsVerificationScreen from '../screens/Auth/SmsVerificationScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import MandatoryPreferencesScreen from '../screens/Preferences/MandatoryPreferencesScreen';
import PrivacyCenterScreen from '../screens/Profile/PrivacyCenterScreen';
import IntellectualPropertyScreen from '../screens/Profile/IntellectualPropertyScreen';
import AppSettingsScreen from '../screens/Profile/AppSettingsScreen';
import PlaceDetailScreen from '../screens/Search/PlaceDetailScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import UserProfileScreen from '../screens/Network/UserProfileScreen';
import NotificationsScreen from '../screens/Network/NotificationsScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, isLoading, isSetupComplete, hasProfile } = useAuth();
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.headerBg,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {session ? (
          isSetupComplete ? (
            // Kurulumu tamamlamış (profilini oluşturmuş ve EN AZ 3 mekan eklemiş) kullanıcılar
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="PrivacyCenter" component={PrivacyCenterScreen} />
              <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
              <Stack.Screen name="IntellectualProperty" component={IntellectualPropertyScreen} />
              <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="UserProfile" component={UserProfileScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
            </>
          ) : (
            // Giriş yapmış ama henüz 3 mekan eklememiş veya profilini tamamlamamış kullanıcılar
            <>
              {hasProfile ? (
                <>
                  <Stack.Screen name="MandatoryPreferences" component={MandatoryPreferencesScreen} />
                  <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                  <Stack.Screen name="MandatoryPreferences" component={MandatoryPreferencesScreen} />
                </>
              )}
              <Stack.Screen name="IntellectualProperty" component={IntellectualPropertyScreen} />
            </>
          )
        ) : (
          // Giriş Yapmamış Kullanıcılar (Public Routes)
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} />
            <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
            <Stack.Screen name="SmsVerification" component={SmsVerificationScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="MandatoryPreferences" component={MandatoryPreferencesScreen} />
            <Stack.Screen name="IntellectualProperty" component={IntellectualPropertyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
