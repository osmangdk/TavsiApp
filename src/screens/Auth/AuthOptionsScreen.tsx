import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone, Mail, Apple } from 'lucide-react-native';

const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleText}>G</Text>
  </View>
);

export default function AuthOptionsScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');

  const isEmailValid = email.length > 5 && email.includes('@');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              Oturum aç veya kaydol
            </Text>
            <Text style={styles.subtitle}>
              Güvendiğiniz ağınızı oluşturmaya başlamak için bir giriş yöntemi seçin.
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.socialButton} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProfileSetup')}
            >
              <GoogleIcon />
              <Text style={styles.socialButtonText}>Google ile devam et</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.appleButton} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProfileSetup')}
            >
              <View style={styles.iconWrapper}>
                <Apple size={22} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={styles.appleButtonText}>Apple ile devam et</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7} onPress={() => navigation.navigate('PhoneInput')}>
              <View style={styles.iconWrapper}>
                <Phone size={20} color="#1E293B" />
              </View>
              <Text style={styles.socialButtonText}>Telefonla devam et</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>YA DA</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.emailContainer}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta adresi"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, isEmailValid ? styles.continueButtonActive : styles.continueButtonInactive]}
            onPress={() => isEmailValid && navigation.navigate('ProfileSetup')}
            activeOpacity={0.8}
            disabled={!isEmailValid}
          >
            <Text style={styles.continueButtonText}>Devam</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  buttonsContainer: {
    marginBottom: 32,
    gap: 16, // adds space between buttons natively
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  iconWrapper: {
    position: 'absolute',
    left: 20,
  },
  googleIcon: {
    position: 'absolute',
    left: 20,
    width: 24,
    height: 24,
    backgroundColor: '#EA4335', // simplified google red
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  socialButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emailContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    outlineStyle: 'none', // For web
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  continueButtonActive: {
    backgroundColor: '#7B2CBF', // Tavsi Primary Purple
  },
  continueButtonInactive: {
    backgroundColor: '#D8B4E2', // Faded Purple
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
