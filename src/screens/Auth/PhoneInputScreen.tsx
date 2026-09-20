import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Phone, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseClient';

export default function PhoneInputScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Telefon Numarası Maskeleme (5XX XXX XX XX)
  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');

    // 90 veya 0 ile başlarsa temizle
    if (cleaned.startsWith('90') && cleaned.length > 2) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    cleaned = cleaned.substring(0, 10);

    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += ' ' + cleaned.substring(3, 6);
    }
    if (cleaned.length > 6) {
      formatted += ' ' + cleaned.substring(6, 8);
    }
    if (cleaned.length > 8) {
      formatted += ' ' + cleaned.substring(8, 10);
    }

    return formatted;
  };

  const rawDigits = phoneNumber.replace(/\D/g, '');
  const isValidPhone = rawDigits.length === 10;

  const handleSendCode = async () => {
    if (!isValidPhone) return;

    setIsLoading(true);
    const fullPhone = `+90${rawDigits}`;
    const displayFormattedPhone = `+90 ${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6, 8)} ${rawDigits.slice(8, 10)}`;

    try {
      // Supabase SMS servisi bağlıysa OTP gönder, değilse demo moda geç
      try {
        await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });
      } catch (e) {
        // Sessiz hata yakalama
      }

      navigation.navigate('SmsVerification', {
        phone: fullPhone,
        displayPhone: displayFormattedPhone,
      });
    } catch (err) {
      navigation.navigate('SmsVerification', {
        phone: fullPhone,
        displayPhone: displayFormattedPhone,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={[styles.title, { color: colors.text }]}>Telefon Numaranız</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Tavsi'ye katılmak ve ağınızı oluşturmak için telefon numaranızı girin. Size doğrulama kodu göndereceğiz.
          </Text>
        </View>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <Phone size={22} color={colors.primary} />
          <Text style={[styles.countryCode, { color: colors.text }]}>+90</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="555 555 55 55"
            placeholderTextColor={colors.subText}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
            maxLength={13}
            autoFocus
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isValidPhone
                ? { backgroundColor: colors.primary }
                : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
            ]}
            onPress={handleSendCode}
            activeOpacity={0.85}
            disabled={!isValidPhone || isLoading}
          >
            <Text style={styles.btnText}>{isLoading ? 'Kod Gönderiliyor...' : 'Kodu Gönder'}</Text>
            <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
    marginBottom: 24,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 12,
    marginRight: 10,
  },
  divider: {
    width: 1,
    height: 24,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
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
