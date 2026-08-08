import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Users, MapPin, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark, t } = useTheme();

  const steps = [
    {
      stepNumber: '1',
      title: 'Çevrenizi Bulun',
      desc: 'Gerçekten güvendiğiniz arkadaşlarınızı, ailenizi ve tanıdıklarınızı ağınıza ekleyin.',
      icon: Users,
      themeColor: '#7B2CBF',
      bgTint: 'rgba(123, 44, 191, 0.1)',
    },
    {
      stepNumber: '2',
      title: 'Tercihleri Görün',
      desc: 'Kliniklerden restoranlara kadar güvendiğiniz insanların nereye gittiğini ve ne önerdiğini keşfedin.',
      icon: MapPin,
      themeColor: '#EC4899',
      bgTint: 'rgba(236, 72, 153, 0.1)',
    },
    {
      stepNumber: '3',
      title: 'Güvenle Keşfedin',
      desc: 'Yapay puanlamalara ve sahte yorumlara değil, tanıdıklarınızın samimi ve gerçek seçimlerine güvenin.',
      icon: ShieldCheck,
      themeColor: '#10B981',
      bgTint: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Üst Başlık */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Tavsi Nasıl Çalışır?</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            3 adımda güvendiğiniz kişilerin deneyim haritasına ulaşın.
          </Text>
        </View>

        {/* 1, 2, 3 Adımlar - Temiz ve Şık Kart Tasarımı */}
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
                {/* Sol Adım Numarası ve İkon Grubu */}
                <View style={styles.leftGroup}>
                  <View style={[styles.iconWrapper, { backgroundColor: step.bgTint }]}>
                    <IconComp size={26} color={step.themeColor} />
                    <View style={[styles.stepNumBadge, { backgroundColor: step.themeColor }]}>
                      <Text style={styles.stepNumText}>{step.stepNumber}</Text>
                    </View>
                  </View>
                </View>

                {/* Metin İçeriği */}
                <View style={styles.textContainer}>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 24,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },

  stepsContainer: {
    gap: 18,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  leftGroup: {
    marginRight: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepNumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justify: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
