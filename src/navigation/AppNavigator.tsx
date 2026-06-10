import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import HowItWorksScreen from '../screens/Onboarding/HowItWorksScreen';
import PrivacyScreen from '../screens/Onboarding/PrivacyScreen';
import AuthOptionsScreen from '../screens/Auth/AuthOptionsScreen';
import PhoneInputScreen from '../screens/Auth/PhoneInputScreen';
import SmsVerificationScreen from '../screens/Auth/SmsVerificationScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import MandatoryPreferencesScreen from '../screens/Preferences/MandatoryPreferencesScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} />
        <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
        <Stack.Screen name="SmsVerification" component={SmsVerificationScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MandatoryPreferences" component={MandatoryPreferencesScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
