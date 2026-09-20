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
import { Phone, Mail, Apple, ChevronLeft, Check } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

// expo-web-browser, OAuth sonrasında tarayıcıyı otomatik kapatır
WebBrowser.maybeCompleteAuthSession();

const AUTH_CALLBACK_URL = 'tavsiapp://auth/callback';

const parseTrustedAuthCallback = (url: string) => {
  const parsed = Linking.parse(url);
  const normalizedPath = (parsed.path || '').replace(/^\/+/, '');

  if (parsed.scheme !== 'tavsiapp' || parsed.hostname !== 'auth' || normalizedPath !== 'callback') {
    return null;
  }

  return parsed;
};

const GoogleIcon = () => (
  <View style={styles.googleIcon}>
    <Text style={styles.googleText}>G</Text>
  </View>
);

interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
}

const getPasswordCriteria = (pwd: string): PasswordCriteria => ({
  minLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasLower: /[a-z]/.test(pwd),
  hasNumber: /[0-9]/.test(pwd),
});

const isStrongPassword = (pwd: string): boolean => {
  const c = getPasswordCriteria(pwd);
  return c.minLength && c.hasUpper && c.hasLower && c.hasNumber;
};

export default function AuthOptionsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

  const passwordCriteria = getPasswordCriteria(password);
  const isFormValid =
    email.trim().length > 5 &&
    email.includes('@') &&
    (isSignUpMode ? isStrongPassword(password) : password.length >= 6);

  // Deep link callback: OAuth veya E-posta aktivasyon linkinden dönüldüğünde
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      try {
        const parsed = parseTrustedAuthCallback(url);
        if (!parsed) return;

        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session?.user) {
            Alert.alert('E-posta Doğrulandı! 🎉', 'Hesabınız başarıyla aktive edildi. Şimdi profilinizi oluşturabilirsiniz.');
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await navigateAfterOAuth(session.user);
        }
      } catch (e) {
        console.log('Deep link parse error:', e);
      }
    };

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) handleDeepLink(initialUrl);
    });

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (url) handleDeepLink(url);
    });
    return () => subscription.remove();
  }, []);

  // OAuth başarılı → kullanıcı bilgilerini kontrol et
  const navigateAfterOAuth = async (user: any) => {
    setOauthLoadingProvider(null);

    // Yeni kullanıcı mı kontrolü (son 1 dakika içinde oluşturulmuşsa)
    const createdAt = new Date(user.created_at).getTime();
    const now = Date.now();
    const isNewUser = (now - createdAt) < 60000;

    const meta = user.user_metadata || {};
    const identityData = user.identities?.[0]?.identity_data || {};
    
    // Google'dan genellikle given_name ve family_name döner
    const givenName = meta.given_name || identityData.given_name || '';
    const familyName = meta.family_name || identityData.family_name || '';
    
    const fullName = meta.full_name || meta.name || identityData.full_name || identityData.name || '';
    
    const firstName = givenName || fullName.trim().split(' ')[0] || '';
    const lastName = familyName || fullName.trim().split(' ').slice(1).join(' ') || '';
    
    const initials = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const avatarUrl = meta.avatar_url || meta.picture || identityData.avatar_url || identityData.picture || '';
    const emailStr = user.email || identityData.email || meta.email || '';

    if (isNewUser) {
      Alert.alert(
        'Hesap Oluştur',
        'Bu Google bilgileri ile Tavsi ağına katılmak ve yeni bir hesap oluşturmak istiyor musunuz?',
        [
          {
            text: 'Vazgeç',
            style: 'cancel',
            onPress: async () => {
              await supabase.auth.signOut();
            },
          },
          {
            text: 'Evet, Oluştur',
            onPress: () => {
              navigation.navigate('ProfileSetup', {
                initialFirstName: firstName,
                initialLastName: lastName,
                initialUsername: initials,
                initialEmail: emailStr,
                initialAvatarUrl: avatarUrl,
                provider: user.app_metadata?.provider || 'oauth',
              });
            },
          },
        ]
      );
    } else {
      // Zaten hesabı var, AppNavigator otomatik olarak ana ekrana yönlendirecek.
      // Herhangi bir şey yapmaya gerek yok.
    }
  };

  // === GOOGLE OAuth ===
  const handleGoogleSignIn = async () => {
    setOauthLoadingProvider('google');
    setAuthError('');
    try {
      // Native build'de custom scheme (tavsiapp://) kullanacağız
      const redirectUrl = AUTH_CALLBACK_URL;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,  // Biz açacağız
          scopes: 'email profile',    // İsim, soyisim ve fotoğraf için izin iste
          queryParams: {
            prompt: 'consent select_account', // Her seferinde hesap sormasını ve izin istemesini zorla
          },
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'Google bağlantısı kurulamadı.');
      }

      // Gerçek Google oturum açma sayfasını aç
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const parsed = parseTrustedAuthCallback(result.url);
        if (!parsed) {
          throw new Error('Geçersiz OAuth yönlendirmesi reddedildi.');
        }
        
        // Hata kontrolü
        const error = parsed.queryParams?.error || parsed.queryParams?.error_description;
        if (error) {
          throw new Error(error.toString());
        }

        // PKCE Flow (code)
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionErr) throw sessionErr;
          if (sessionData?.user) {
            await navigateAfterOAuth(sessionData.user);
            return;
          }
        } else {
          throw new Error('OAuth sağlayıcısı güvenli PKCE kodu döndürmedi.');
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
      // Hata mesajını daha açıklayıcı yapalım
      setAuthError(err.message || 'Google ile giriş başarısız. Lütfen tekrar deneyin.');
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
      const redirectUrl = AUTH_CALLBACK_URL;
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
        const parsed = parseTrustedAuthCallback(result.url);
        if (!parsed) {
          throw new Error('Geçersiz OAuth yönlendirmesi reddedildi.');
        }
        
        const error = parsed.queryParams?.error || parsed.queryParams?.error_description;
        if (error) {
          throw new Error(error.toString());
        }

        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionErr) throw sessionErr;
          if (sessionData?.user) {
            await navigateAfterOAuth(sessionData.user);
            return;
          }
        } else {
          throw new Error('OAuth sağlayıcısı güvenli PKCE kodu döndürmedi.');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await navigateAfterOAuth(session.user);
      }
    } catch (err: any) {
      console.log('Apple OAuth Hata:', err);
      setAuthError(err.message || 'Apple ile giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // === E-POSTA KAYIT ===
  const handleSignUp = async () => {
    if (!isStrongPassword(password)) {
      setAuthError('Şifreniz en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const redirectUrl = AUTH_CALLBACK_URL;
      const { data: authData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        let msg = error.message || '';
        if (msg.toLowerCase().includes('captcha')) {
          msg = 'Güvenlik doğrulaması (CAPTCHA) hatası: Supabase panelinde CAPTCHA koruması açık ancak istemci widgetı tanımlı değil. Lütfen Supabase Dashboard > Authentication > Bot Protection/Detection alanından CAPTCHA seçeneğini kapatın.';
        }
        setAuthError(msg);
        return;
      }

      if (authData?.user) {
        Alert.alert(
          'Aktivasyon E-postası Gönderildi! 📩',
          `${email.trim()} adresinize bir aktivasyon bağlantısı gönderdik.\n\nHesabınızı aktif etmek ve uygulamayı açabilmek için lütfen e-postanızdaki linke tıklayın.`,
          [{ text: 'Tamam, Anladım', onPress: () => setIsSignUpMode(false) }]
        );
        setIsSignUpMode(false);
      }
    } catch (err: any) {
      setAuthError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // === ŞİFREMİ UNUTTUM ===
  const handleForgotPassword = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      Alert.alert(
        'E-posta Adresi Gerekli',
        'Şifre sıfırlama bağlantısı gönderebilmemiz için lütfen yukarıdaki e-posta alanına geçerli bir e-posta adresi yazın.'
      );
      return;
    }

    setIsResetPasswordLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: AUTH_CALLBACK_URL,
      });

      if (error) {
        Alert.alert('Hata', error.message || 'Şifre sıfırlama bağlantısı gönderilemedi.');
      } else {
        Alert.alert(
          'Sıfırlama Bağlantısı Gönderildi 📩',
          `${targetEmail} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.`
        );
      }
    } catch (err: any) {
      Alert.alert('Hata', 'Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  // === E-POSTA GİRİŞ ===
  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.toLowerCase().includes('captcha')) {
          setAuthError('Güvenlik doğrulaması (CAPTCHA) hatası: Supabase panelinde CAPTCHA açık ancak istemci widgetı tanımlı değil. Lütfen Supabase Dashboard > Authentication > Bot Protection/Detection alanından CAPTCHA seçeneğini kapatın.');
          return;
        }
        if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
          Alert.alert(
            'E-posta Doğrulanmadı ⚠️',
            'Hesabınızı kullanabilmek için e-postanıza gönderilen aktivasyon linkine tıklamalısınız.\n\nAktivasyon e-postasını tekrar göndermek ister misiniz?',
            [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Tekrar Gönder',
                onPress: async () => {
                  try {
                    await supabase.auth.resend({
                      type: 'signup',
                      email: email.trim(),
                      options: {
                        emailRedirectTo: AUTH_CALLBACK_URL,
                      },
                    });
                    Alert.alert('Başarılı 📩', 'Aktivasyon e-postası tekrar gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.');
                  } catch (e) {
                    Alert.alert('Hata', 'Aktivasyon e-postası gönderilemedi.');
                  }
                },
              },
            ]
          );
          setAuthError('Lütfen önce e-postanıza gönderilen aktivasyon linkine tıklayın.');
        } else if (
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

            {isSignUpMode ? (
              <View style={styles.passwordRulesContainer}>
                <Text style={[styles.passwordRulesTitle, { color: colors.subText }]}>
                  Şifre Gereksinimleri:
                </Text>
                <View style={styles.criteriaRow}>
                  <View style={[styles.criteriaDot, passwordCriteria.minLength && styles.criteriaDotValid]}>
                    {passwordCriteria.minLength ? (
                      <Check size={10} color="#FFFFFF" />
                    ) : (
                      <View style={styles.criteriaBullet} />
                    )}
                  </View>
                  <Text style={[styles.criteriaText, { color: passwordCriteria.minLength ? '#10B981' : colors.subText }]}>
                    En az 8 karakter
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <View style={[styles.criteriaDot, passwordCriteria.hasUpper && styles.criteriaDotValid]}>
                    {passwordCriteria.hasUpper ? (
                      <Check size={10} color="#FFFFFF" />
                    ) : (
                      <View style={styles.criteriaBullet} />
                    )}
                  </View>
                  <Text style={[styles.criteriaText, { color: passwordCriteria.hasUpper ? '#10B981' : colors.subText }]}>
                    En az bir büyük harf (A-Z)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <View style={[styles.criteriaDot, passwordCriteria.hasLower && styles.criteriaDotValid]}>
                    {passwordCriteria.hasLower ? (
                      <Check size={10} color="#FFFFFF" />
                    ) : (
                      <View style={styles.criteriaBullet} />
                    )}
                  </View>
                  <Text style={[styles.criteriaText, { color: passwordCriteria.hasLower ? '#10B981' : colors.subText }]}>
                    En az bir küçük harf (a-z)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <View style={[styles.criteriaDot, passwordCriteria.hasNumber && styles.criteriaDotValid]}>
                    {passwordCriteria.hasNumber ? (
                      <Check size={10} color="#FFFFFF" />
                    ) : (
                      <View style={styles.criteriaBullet} />
                    )}
                  </View>
                  <Text style={[styles.criteriaText, { color: passwordCriteria.hasNumber ? '#10B981' : colors.subText }]}>
                    En az bir rakam (0-9)
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.forgotPasswordBtn}
                onPress={handleForgotPassword}
                disabled={isResetPasswordLoading || anyLoading}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  {isResetPasswordLoading ? 'Gönderiliyor...' : 'Şifremi unuttum'}
                </Text>
              </TouchableOpacity>
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
                    isFormValid
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
                    { flex: 1 },
                  ]}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                  disabled={!isFormValid || anyLoading}
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  passwordRulesContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  passwordRulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  criteriaDotValid: {
    backgroundColor: '#10B981',
  },
  criteriaBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  criteriaText: {
    fontSize: 12,
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
