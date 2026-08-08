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

  const handleSendCode = async () => {
    if (phoneNumber.trim().length < 10) return;

    setIsLoading(true);
    const fullPhone = `+90${phoneNumber.trim().replace(/\s+/g, '')}`;

    try {
      // Supabase Phone Auth isteği gönder
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        console.log('Supabase Phone Auth Warning:', error.message);
      }

      // Her durumda SMS Doğrulama ekranına yönlendir (Demo doğrulama kodu: 1234)
      navigation.navigate('SmsVerification', { phone: fullPhone });
    } catch (err) {
      navigation.navigate('SmsVerification', { phone: fullPhone });
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
            placeholder="5XX XXX XX XX"
            placeholderTextColor={colors.subText}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={11}
            autoFocus
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              phoneNumber.trim().length >= 10
                ? { backgroundColor: colors.primary }
                : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
            ]}
            onPress={handleSendCode}
            activeOpacity={0.85}
            disabled={phoneNumber.trim().length < 10 || isLoading}
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
