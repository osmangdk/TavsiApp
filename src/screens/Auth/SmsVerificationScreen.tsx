import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowRight, MessageSquareCode, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

export default function SmsVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { checkSetupStatus } = useAuth();

  const phone = route.params?.phone || '+905000000000';
  const displayPhone = route.params?.displayPhone || phone;

  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verified, setVerified] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every((digit) => digit !== '');

  const handleVerify = async () => {
    if (!isComplete) return;

    setIsLoading(true);
    setErrorMsg('');
    const fullCode = code.join('');

    // Demo / Test Modu için '1234' veya '0000' veya '5555'
    if (fullCode === '1234' || fullCode === '0000' || fullCode === '5555') {
      setIsLoading(false);
      navigation.navigate('ProfileSetup', { initialPhone: phone });
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: fullCode,
        type: 'sms',
      });

      if (error) {
        console.log('OTP Verify Warning:', error.message);
        setErrorMsg('Kod geçersiz. Test modu kodu: 1234');
        setIsLoading(false);
      } else if (data?.user) {
        // ✅ Doğrulama başarılı — kısa onay ekranı göster
        setVerified(true);
        setIsLoading(false);

        // checkSetupStatus çağırarak mevcut kullanıcı mı yeni mi belirle
        await checkSetupStatus(data.user.id);

        // AppNavigator isSetupComplete durumuna göre otomatik yönlendirir.
        // Yeni kullanıcıysa → ProfileSetup gösterilecek (hasProfile=false)
        // Eski kullanıcıysa ve 3+ mekan varsa → MainTabs gösterilecek
        // Eski kullanıcıysa ama mekan eksiğiyse → MandatoryPreferences gösterilecek
        // Explicit navigation yok — AppNavigator halleder.
      }
    } catch (err) {
      setErrorMsg('Test modu doğrulama kodu: 1234');
      setIsLoading(false);
    }
  };

  // Doğrulama başarılı olduğunda gösterilen onay ekranı
  if (verified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20
          }}>
            <CheckCircle size={44} color="#16A34A" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
            Hesabınız Doğrulandı!
          </Text>
          <Text style={{ fontSize: 14, color: colors.subText, textAlign: 'center', lineHeight: 22 }}>
            Hoş geldiniz, yönlendiriliyorsunuz...
          </Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.cardBg }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primaryBg }]}>
            <MessageSquareCode size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Doğrulama Kodu</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            <Text style={{ fontWeight: 'bold' }}>{displayPhone}</Text> numarasına gönderilen 4 haneli doğrulama kodunu girin.
          </Text>

          {/* Test / Demo Bilgi Kutusu */}
          <View style={[styles.demoBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.demoText, { color: colors.primary }]}>
              💡 Test / Geliştirme Kodu: <Text style={{ fontWeight: '900' }}>1234</Text>
            </Text>
          </View>
        </View>

        {/* 4 Haneli Kod Girdisi */}
        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.text,
                },
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity style={styles.resendBtn} onPress={() => Alert.alert('KOD GÖNDERİLDİ', 'Test kodunuz: 1234')}>
          <Text style={[styles.resendText, { color: colors.primary }]}>Kodu Tekrar Gönder (0:59)</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isComplete ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
            ]}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={!isComplete || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.btnText}>Doğrula ve Devam Et</Text>
                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  demoBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  codeInput: {
    width: 58,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  resendBtn: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 32,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
