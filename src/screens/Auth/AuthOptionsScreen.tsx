import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Phone, Mail, Apple, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// expo-web-browser, OAuth sonrasında tarayıcıyı otomatik kapatır
WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleText}>G</Text>
  </View>
);

export default function AuthOptionsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const isFormValid = email.trim().length > 5 && email.includes('@') && password.length >= 6;

  // Deep link callback: OAuth geri döndüğünde session'u oturuma al
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (!url) return;
      // Supabase, hash'teki token'ı otomatik işler
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await navigateAfterOAuth(session.user);
      }
    });
    return () => subscription.remove();
  }, []);

  // OAuth başarılı → kullanıcı bilgilerini ProfileSetup ekranına gönder
  const navigateAfterOAuth = async (user: any) => {
    setOauthLoadingProvider(null);
    const meta = user.user_metadata || {};
    const fullName: string = meta.full_name || meta.name || '';
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const initials = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const avatarUrl: string = meta.avatar_url || meta.picture || '';

    navigation.navigate('ProfileSetup', {
      initialFirstName: firstName,
      initialLastName: lastName,
      initialUsername: initials,
      initialEmail: user.email || '',
      initialAvatarUrl: avatarUrl,
      provider: user.app_metadata?.provider || 'oauth',
    });
  };

  // === GOOGLE OAuth ===
  const handleGoogleSignIn = async () => {
    setOauthLoadingProvider('google');
    setAuthError('');
    try {
      // Sabit scheme: Expo dev modunda Linking.createURL localhost döndürdüğü için
      // her zaman tavsiapp:// kullanıyoruz (Supabase Redirect URLs'e eklenmeli)
      const redirectUrl = 'tavsiapp://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,  // Biz açacağız
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'Google bağlantısı kurulamadı.');
      }

      // Gerçek Google oturum açma sayfasını aç
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        // URL'deki access_token ve refresh_token'ı parse et
        const parsed = new URL(result.url);
        const hash = parsed.hash.substring(1); // # işaretini kaldır
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw sessionErr;
          if (sessionData?.user) {
            await navigateAfterOAuth(sessionData.user);
            return;
          }
        }
      }

      // Android'de 'dismiss' döner ama oturum açılmış olabilir
      // Her durumda session kontrolü yap
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await navigateAfterOAuth(session.user);
      }
    } catch (err: any) {
      console.log('Google OAuth Hata:', err);
      setAuthError('Google ile giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // === APPLE OAuth ===
  const handleAppleSignIn = async () => {
    setOauthLoadingProvider('apple');
    setAuthError('');
    try {
      if (Platform.OS === 'ios') {
        // iOS'ta native Apple Sign In dene
        try {
          // expo-apple-authentication varsa kullan
          const AppleAuth = require('expo-apple-authentication');
          const credential = await AppleAuth.signInAsync({
            requestedScopes: [
              AppleAuth.AppleAuthenticationScope.FULL_NAME,
              AppleAuth.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (credential.identityToken) {
            const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithIdToken({
              provider: 'apple',
              token: credential.identityToken,
            });
            if (sessionErr) throw sessionErr;
            if (sessionData?.user) {
              // Apple ilk girişte isim verebilir, sonrakilerde vermez
              const appleUser = { ...sessionData.user };
              if (credential.fullName?.givenName) {
                appleUser.user_metadata = {
                  ...appleUser.user_metadata,
                  full_name: `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim(),
                };
              }
              await navigateAfterOAuth(appleUser);
              return;
            }
          }
        } catch (appleNativeErr: any) {
          if (appleNativeErr.code === 'ERR_CANCELED') {
            setOauthLoadingProvider(null);
            return;
          }
          // Native çalışmadıysa web OAuth'a geç
          console.log('Native Apple başarısız, web OAuth deneniyor:', appleNativeErr);
        }
      }

      // Android veya native başarısızsa: Web tabanlı Apple OAuth
      const redirectUrl = 'tavsiapp://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'Apple bağlantısı kurulamadı.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const parsed = new URL(result.url);
        const hash = parsed.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw sessionErr;
          if (sessionData?.user) {
            await navigateAfterOAuth(sessionData.user);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await navigateAfterOAuth(session.user);
        }
      }
    } catch (err: any) {
      console.log('Apple OAuth Hata:', err);
      setAuthError('Apple ile giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // === E-POSTA KAYIT ===
  const handleSignUp = async () => {
    setIsLoading(true);
    setAuthError('');

    if (!inviteCode || inviteCode.trim().length === 0) {
      setAuthError('Kayıt olmak için lütfen geçerli bir davetiye kodu girin.');
      setIsLoading(false);
      return;
    }

    const trimmedCode = inviteCode.trim().toUpperCase();

    try {
      const { data: inviteData, error: inviteCheckError } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', trimmedCode)
        .single();

      if (inviteCheckError || !inviteData) {
        setAuthError('Geçersiz bir davetiye kodu girdiniz.');
        return;
      }

      if (inviteData.used_count >= inviteData.max_uses) {
        setAuthError('Bu davetiye kodunun kullanım limiti dolmuş.');
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({ email: email.trim(), password });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (authData.user) {
        await supabase
          .from('invitations')
          .update({ used_count: inviteData.used_count + 1 })
          .eq('id', inviteData.id);

        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from('invitations')
          .insert([{ inviter_id: authData.user.id, code: newCode, used_count: 0, max_uses: 5 }]);

        Alert.alert(
          'Kayıt Başarılı!',
          'E-posta adresinize gelen aktivasyon linkine tıklayarak hesabınızı doğrulayın.'
        );
        setIsSignUpMode(false);
      }
    } catch (err: any) {
      setAuthError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // === E-POSTA GİRİŞ ===
  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('fetch') ||
          msg.includes('network') ||
          msg.includes('Failed to fetch') ||
          msg.includes('UnknownHost')
        ) {
          setAuthError('İnternet/sunucu bağlantısı kurulamadı.');
        } else {
          setAuthError('E-posta veya şifre hatalı.');
        }
      }
    } catch (err: any) {
      setAuthError('İnternet bağlantısı kurulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const anyLoading = isLoading || oauthLoadingProvider !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* === SOSYAL MED. BUTONLARI === */}
          <View style={styles.buttonsContainer}>
            {/* Google */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              activeOpacity={0.75}
              onPress={handleGoogleSignIn}
              disabled={anyLoading}
            >
              {oauthLoadingProvider === 'google' ? (
                <ActivityIndicator size="small" color="#EA4335" style={styles.iconWrapper} />
              ) : (
                <GoogleIcon />
              )}
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Google ile devam et</Text>
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity
              style={styles.appleButton}
              activeOpacity={0.75}
              onPress={handleAppleSignIn}
              disabled={anyLoading}
            >
              {oauthLoadingProvider === 'apple' ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.iconWrapper} />
              ) : (
                <View style={styles.iconWrapper}>
                  <Apple size={22} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              )}
              <Text style={styles.appleButtonText}>Apple ile devam et</Text>
            </TouchableOpacity>

            {/* Telefon */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('PhoneInput')}
              disabled={anyLoading}
            >
              <View style={styles.iconWrapper}>
                <Phone size={20} color={colors.text} />
              </View>
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Telefonla devam et</Text>
            </TouchableOpacity>
          </View>

          {/* Ayırıcı */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.subText }]}>YA DA</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* E-POSTA / ŞİFRE */}
          <View style={styles.emailContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Mail size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="E-posta adresi"
                placeholderTextColor={colors.subText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="none"
                importantForAutofill="no"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 12 },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Şifreniz"
                placeholderTextColor={colors.subText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {isSignUpMode && (
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 12 },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Davetiye Kodu (Zorunlu)"
                  placeholderTextColor={colors.subText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
              </View>
            )}
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          {/* BUTONLAR */}
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
                  disabled={anyLoading}
                >
                  <Text style={[styles.continueButtonText, { color: colors.primary }]}>Hesap Oluştur</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    isFormValid
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
                    { flex: 1 },
                  ]}
                  onPress={handleSignIn}
                  activeOpacity={0.8}
                  disabled={!isFormValid || anyLoading}
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
                  disabled={anyLoading}
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
                  disabled={!isFormValid || !inviteCode || anyLoading}
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '600',
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
