import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone, Mail, Apple, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';

const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleText}>G</Text>
  </View>
);

export default function AuthOptionsScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const isFormValid = email.length > 5 && email.includes('@') && password.length >= 6;

  const handleSignUp = async () => {
    setIsLoading(true);
    setAuthError('');
    
    // 1. Davetiye kodu kontrolü
    if (!inviteCode || inviteCode.trim().length === 0) {
      setAuthError('Kayıt olmak için lütfen geçerli bir davetiye kodu girin.');
      setIsLoading(false);
      return;
    }

    const trimmedCode = inviteCode.trim().toUpperCase();

    // 2. Veritabanından kodu kontrol et
    const { data: inviteData, error: inviteCheckError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', trimmedCode)
      .single();

    if (inviteCheckError || !inviteData) {
      setAuthError('Geçersiz bir davetiye kodu girdiniz.');
      setIsLoading(false);
      return;
    }

    if (inviteData.used_count >= inviteData.max_uses) {
      setAuthError('Bu davetiye kodunun kullanım limiti dolmuş (Maksimum 5 kişi).');
      setIsLoading(false);
      return;
    }

    // 3. Supabase Auth Kaydı
    const { data: authData, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return;
    } else if (authData.user) {
      // 4. Kodu kullanıldı olarak işaretle
      await supabase
        .from('invitations')
        .update({ used_count: inviteData.used_count + 1 })
        .eq('id', inviteData.id);
        
      // 5. Yeni kullanıcı için kendi davetiye kodunu oluştur (Örn: A1B2C3)
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase
        .from('invitations')
        .insert([{ inviter_id: authData.user.id, code: newCode, used_count: 0, max_uses: 5 }]);

      Alert.alert(
        'Kayıt Başarılı! E-postanızı Onaylayın', 
        'Lütfen e-posta adresinize (noreply@supabase.io adresinden) gelen aktivasyon linkine tıklayarak hesabınızı doğrulayın. Doğrulama yapmadan sisteme giriş yapamazsınız.'
      );
      setIsSignUpMode(false); // Giriş moduna dön
    }
    
    setIsLoading(false);
  };
    
  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setAuthError('E-posta veya şifre hatalı.');
    }
    // Başarılıysa zaten AuthContext session yakalayıp AppNavigator üzerinden MainTabs'e yönlendirecek.
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              Oturum aç veya kaydol
            </Text>
            <Text style={styles.subtitle}>
              Sadece davetiye ile çalışan Tavsi ağına katılmak için bir yöntem seçin.
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
            <View style={[styles.inputWrapper, { marginTop: 12 }]}>
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {isSignUpMode && (
              <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Davetiye Kodu (Zorunlu)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
              </View>
            )}
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!isSignUpMode ? (
              <>
                <TouchableOpacity 
                  style={[styles.continueButton, { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#7B2CBF' }]}
                  onPress={() => setIsSignUpMode(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.continueButtonText, { color: '#7B2CBF' }]}>Hesap Oluştur</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.continueButton, isFormValid ? styles.continueButtonActive : styles.continueButtonInactive, { flex: 1 }]}
                  onPress={handleSignIn}
                  activeOpacity={0.8}
                  disabled={!isFormValid || isLoading}
                >
                  <Text style={styles.continueButtonText}>{isLoading ? 'Bekleyin...' : 'Giriş Yap'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.continueButton, { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#64748B' }]}
                  onPress={() => setIsSignUpMode(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.continueButtonText, { color: '#64748B' }]}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.continueButton, isFormValid && inviteCode ? styles.continueButtonActive : styles.continueButtonInactive, { flex: 1 }]}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                  disabled={!isFormValid || !inviteCode || isLoading}
                >
                  <Text style={styles.continueButtonText}>{isLoading ? '...' : 'Kayıt Ol'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '600',
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
