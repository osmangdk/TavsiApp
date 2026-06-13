import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import HowItWorksScreen from '../screens/Onboarding/HowItWorksScreen';
import PrivacyScreen from '../screens/Onboarding/PrivacyScreen';
import AuthOptionsScreen from '../screens/Auth/AuthOptionsScreen';
import PhoneInputScreen from '../screens/Auth/PhoneInputScreen';
import SmsVerificationScreen from '../screens/Auth/SmsVerificationScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import MandatoryPreferencesScreen from '../screens/Preferences/MandatoryPreferencesScreen';
import PrivacyCenterScreen from '../screens/Profile/PrivacyCenterScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#7B2CBF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // Giriş Yapmış Kullanıcılar (Protected Routes)
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="MandatoryPreferences" component={MandatoryPreferencesScreen} />
            <Stack.Screen name="PrivacyCenter" component={PrivacyCenterScreen} />
          </>
        ) : (
          // Giriş Yapmamış Kullanıcılar (Public Routes)
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} />
            <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
            <Stack.Screen name="SmsVerification" component={SmsVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
