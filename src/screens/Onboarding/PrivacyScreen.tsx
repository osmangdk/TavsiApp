import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function PrivacyScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <ShieldAlert size={44} color="#F59E0B" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Önce Gizlilik</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Tavsi'de kontrol tamamen sizde. Her tercihiniz için görünürlüğü ayrı ayrı belirleyebilirsiniz.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.checkRow}>
            <CheckCircle size={22} color="#10B981" style={{ marginTop: 2 }} />
            <Text style={[styles.checkText, { color: colors.text }]}>
              Hangi doktorlara gittiğinizi sadece 'Ben' veya 'Arkadaşlar' olarak kısıtlayın.
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.checkRow}>
            <CheckCircle size={22} color="#10B981" style={{ marginTop: 2 }} />
            <Text style={[styles.checkText, { color: colors.text }]}>
              Restoran favorilerinizi 'Ağa Açık' hale getirerek çevrenize ilham verin.
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.checkRow}>
            <CheckCircle size={22} color="#10B981" style={{ marginTop: 2 }} />
            <Text style={[styles.checkText, { color: colors.text }]}>
              İsterseniz tercihlerinizi profil isminizi gizleyerek 'Anonim' paylaşın.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AuthOptions')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Hesap Oluştur</Text>
          <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 44 : 24,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  card: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },

  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
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

