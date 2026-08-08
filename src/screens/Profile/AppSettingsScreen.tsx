import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, Moon, Laptop, Globe, Check, Palette, Shield } from 'lucide-react-native';
import { useTheme, ThemeMode, AppLanguage } from '../../contexts/ThemeContext';

export default function AppSettingsScreen() {
  const navigation = useNavigation<any>();
  const { themeMode, setThemeMode, language, setLanguage, isDark, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Uygulama & Görünüm Ayarları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Görünüm Modu / Tema Seçimi */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Palette size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görünüm Modu (Tema)</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.subText }]}>
            Uygulamanın açık, karanlık veya sistem ayarlarınıza uyumlu görünümünü seçin.
          </Text>

          {/* Option 1: Sistem */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              themeMode === 'system' && { borderColor: colors.primary, backgroundColor: colors.primaryBg }
            ]}
            onPress={() => setThemeMode('system')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.border }]}>
              <Laptop size={22} color={themeMode === 'system' ? colors.primary : colors.subText} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Sistem Ayarlarını Kullan</Text>
              <Text style={[styles.optionDesc, { color: colors.subText }]}>
                Cihazınızın sistem temasını (Açık / Karanlık) otomatik uygular.
              </Text>
            </View>
            <View style={[styles.radioCircle, themeMode === 'system' && { borderColor: colors.primary }]}>
              {themeMode === 'system' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Option 2: Açık Mod */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              themeMode === 'light' && { borderColor: colors.primary, backgroundColor: colors.primaryBg }
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.border }]}>
              <Sun size={22} color={themeMode === 'light' ? colors.primary : colors.subText} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Açık Mod</Text>
              <Text style={[styles.optionDesc, { color: colors.subText }]}>
                Ferah beyaz arka plan ve net koyu fontlar.
              </Text>
            </View>
            <View style={[styles.radioCircle, themeMode === 'light' && { borderColor: colors.primary }]}>
              {themeMode === 'light' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Option 3: Karanlık Mod */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              themeMode === 'dark' && { borderColor: colors.primary, backgroundColor: colors.primaryBg }
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.border }]}>
              <Moon size={22} color={themeMode === 'dark' ? colors.primary : colors.subText} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Karanlık Mod (Dark Mode)</Text>
              <Text style={[styles.optionDesc, { color: colors.subText }]}>
                Göz yormayan şık koyu tema. Tüm yazılar parlak beyaz görünür.
              </Text>
            </View>
            <View style={[styles.radioCircle, themeMode === 'dark' && { borderColor: colors.primary }]}>
              {themeMode === 'dark' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Dil Seçimi */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Globe size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Uygulama Dili / Language</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.subText }]}>
            Uygulamanın varsayılan dilini belirleyin.
          </Text>

          <View style={styles.langGrid}>
            <TouchableOpacity
              style={[
                styles.langCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                language === 'tr' && { borderColor: colors.primary, backgroundColor: colors.primaryBg }
              ]}
              onPress={() => setLanguage('tr')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24, marginBottom: 6 }}>🇹🇷</Text>
              <Text style={[styles.langName, { color: colors.text }]}>Türkçe</Text>
              {language === 'tr' && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                language === 'en' && { borderColor: colors.primary, backgroundColor: colors.primaryBg }
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24, marginBottom: 6 }}>🇬🇧</Text>
              <Text style={[styles.langName, { color: colors.text }]}>English</Text>
              {language === 'en' && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Önizleme Kartı */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Tema Önizlemesi</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={[styles.previewBadge, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.previewBadgeText, { color: colors.badgeText }]}>
                  {isDark ? '🌙 Karanlık Mod Aktif' : '☀️ Açık Mod Aktif'}
                </Text>
              </View>
            </View>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Tavsi Rehberi</Text>
            <Text style={[styles.previewSub, { color: colors.subText }]}>
              Güvendiğiniz kişilerin mekan tavsiyeleri burada sorunsuz görüntülenir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  section: { marginBottom: 28 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionDesc: { fontSize: 13, marginBottom: 16, lineHeight: 18 },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  optionDesc: { fontSize: 12, lineHeight: 17 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleInner: { width: 10, height: 10, borderRadius: 5 },

  langGrid: { flexDirection: 'row', gap: 12 },
  langCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  langName: { fontSize: 14, fontWeight: '700' },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewBadgeText: { fontSize: 12, fontWeight: '700' },
  previewTitle: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  previewSub: { fontSize: 13, lineHeight: 19 },
});
