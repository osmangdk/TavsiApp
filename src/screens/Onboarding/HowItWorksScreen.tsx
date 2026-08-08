import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Users, MapPin, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark, t } = useTheme();

  const steps = [
    {
      num: '01',
      title: '1. Çevrenizi Bulun',
      desc: 'Gerçekten güvendiğiniz arkadaşlarınızı, ailenizi ve meslektaşlarınızı ağınıza ekleyin.',
      icon: Users,
      badgeColor: '#7B2CBF',
      badgeBg: 'rgba(123, 44, 191, 0.12)',
    },
    {
      num: '02',
      title: '2. Tercihleri Görün',
      desc: 'Doktorlardan restoranlara kadar güvendiğiniz insanların nereye gittiğini ve ne önerdiğini görün.',
      icon: MapPin,
      badgeColor: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.12)',
    },
    {
      num: '03',
      title: '3. Güvenle Keşfedin',
      desc: 'Yapay puanlamalara ve sahte yorumlara değil, tanıdıklarınızın samimi ve gerçek seçimlerine güvenin.',
      icon: ShieldCheck,
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Üst Başlık & rozet */}
        <View style={styles.headerSection}>
          <View style={[styles.topBadge, { backgroundColor: colors.primaryBg }]}>
            <Sparkles size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.topBadgeText, { color: colors.primary }]}>AKILLI AĞ REHBERİ</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Tavsi Nasıl Çalışır?</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            3 basit adımda güvendiğiniz kişilerin deneyim haritasına ulaşın.
          </Text>
        </View>

        {/* 1, 2, 3 Maddeler Kartlı & Aralıklı Tasarım */}
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <View
                key={idx}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {/* Numara Rozeti */}
                <View style={[styles.numBadge, { backgroundColor: step.badgeBg }]}>
                  <Text style={[styles.numText, { color: step.badgeColor }]}>{step.num}</Text>
                </View>

                {/* İkon */}
                <View style={[styles.iconBox, { backgroundColor: step.badgeBg }]}>
                  <IconComp size={28} color={step.badgeColor} />
                </View>

                {/* Metinler */}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: colors.subText }]}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Alt Buton */}
      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Privacy')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Devam Et</Text>
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
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  stepsContainer: {
    gap: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  numBadge: {
    position: 'absolute',
    top: 14,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  numText: {
    fontSize: 11,
    fontWeight: '900',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justify: 'center',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    paddingRight: 30,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
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
