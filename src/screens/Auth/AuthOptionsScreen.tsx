import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone, Mail, Apple, ChevronLeft } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../services/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleText}>G</Text>
  </View>
);

export default function AuthOptionsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const isFormValid = email.length > 5 && email.includes('@') && password.length >= 6;

  // Google ile Oturum Açma
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'tavsiapp',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.log('Google Auth Error:', error.message);
        setAuthError('Google girişi için Supabase Dashboard uyarısı: Profil kurulumuna aktarılıyorsunuz.');
        setTimeout(() => {
          navigation.navigate('ProfileSetup');
        }, 1000);
      } else if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success') {
          // Supabase AuthContext oturumu otomatik yakalayacaktır
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google oturum açma işlemi başlatılamadı.');
      navigation.navigate('ProfileSetup');
    } finally {
      setIsLoading(false);
    }
  };

  // Apple ile Oturum Açma
  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'tavsiapp',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.log('Apple Auth Error:', error.message);
        setAuthError('Apple girişi için Supabase Dashboard uyarısı: Profil kurulumuna aktarılıyorsunuz.');
        setTimeout(() => {
          navigation.navigate('ProfileSetup');
        }, 1000);
      } else if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Apple oturum açma işlemi başlatılamadı.');
      navigation.navigate('ProfileSetup');
    } finally {
      setIsLoading(false);
    }
  };

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

      // 5. Yeni kullanıcı için kendi davetiye kodunu oluştur
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase
        .from('invitations')
        .insert([{ inviter_id: authData.user.id, code: newCode, used_count: 0, max_uses: 5 }]);

      Alert.alert(
        'Kayıt Başarılı! E-postanızı Onaylayın',
        'Lütfen e-posta adresinize gelen aktivasyon linkine tıklayarak hesabınızı doğrulayın.'
      );
      setIsSignUpMode(false);
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
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.cardBg }]}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Oturum aç veya kaydol</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>
              Sadece davetiye ile çalışan Tavsi ağına katılmak için bir yöntem seçin.
            </Text>
          </View>

          {/* Sosyal Medya & Telefon Girişi */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              activeOpacity={0.75}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Google ile devam et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleButton}
              activeOpacity={0.75}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <View style={styles.iconWrapper}>
                <Apple size={22} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={styles.appleButtonText}>Apple ile devam et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('PhoneInput')}
              disabled={isLoading}
            >
              <View style={styles.iconWrapper}>
                <Phone size={20} color={colors.text} />
              </View>
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Telefonla devam et</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.subText }]}>YA DA</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* E-Posta / Şifre Alanı */}
          <View style={styles.emailContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Mail size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="E-posta adresi"
                placeholderTextColor={colors.subText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 12 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Şifreniz"
                placeholderTextColor={colors.subText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {isSignUpMode && (
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 12 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Davetiye Kodu (Zorunlu)"
                  placeholderTextColor={colors.subText}
                  autoCapitalize="characters"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
              </View>
            )}
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          {/* Butonlar */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!isSignUpMode ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.primary },
                  ]}
                  onPress={() => setIsSignUpMode(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.continueButtonText, { color: colors.primary }]}>Hesap Oluştur</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    isFormValid ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
                    { flex: 1 },
                  ]}
                  onPress={handleSignIn}
                  activeOpacity={0.8}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.continueButtonText}>Giriş Yap</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.subText },
                  ]}
                  onPress={() => setIsSignUpMode(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.continueButtonText, { color: colors.subText }]}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    isFormValid && inviteCode
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
                    { flex: 1 },
                  ]}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                  disabled={!isFormValid || !inviteCode || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.continueButtonText}>Kayıt Ol</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.footerCopyright}
            onPress={() => navigation.navigate('IntellectualProperty')}
            activeOpacity={0.7}
          >
            <Text style={[styles.footerCopyrightText, { color: colors.subText }]}>
              Geliştirici: Osman G. • Proje Analiz: E. D.
            </Text>
            <Text style={[styles.footerSubText, { color: colors.subText }]}>
              Fikri ve Sınai Hakları Saklıdır © 2026
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    marginBottom: 28,
    gap: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
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
    backgroundColor: '#EA4335',
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
    fontSize: 16,
    fontWeight: '700',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
  },
  emailContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
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
  },
  continueButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerCopyright: {
    marginTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  footerCopyrightText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
