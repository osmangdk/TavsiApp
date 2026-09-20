import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Code, Cpu, Award, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function IntellectualPropertyScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Fikri ve Sınai Haklar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner */}
        <View style={[styles.bannerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.bannerIconWrapper, { backgroundColor: colors.primaryBg }]}>
            <Shield size={32} color={colors.primary} />
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Tüm Hakları Saklıdır</Text>
          <Text style={[styles.bannerSubtitle, { color: colors.subText }]}>
            Tavsi mobil & web uygulamasının tüm fikri, sınai, yazılımsal ve tasarımsal hakları koruma altındadır.
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={styles.badgeText}>Resmi Telif Bildirimi</Text>
            </View>
          </View>
        </View>

        {/* Proje Künyesi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Proje Künyesi</Text>
          <Text style={[styles.sectionDesc, { color: colors.subText }]}>Tavsi platformunun geliştirilmesi ve analiz süreçlerinde emeği geçenler:</Text>

          {/* Geliştirici Kartı */}
          <View style={[styles.creditCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.creditIconWrapper, { backgroundColor: colors.primaryBg }]}>
              <Code size={24} color={colors.primary} />
            </View>
            <View style={styles.creditInfo}>
              <Text style={[styles.creditRole, { color: colors.subText }]}>Geliştirici</Text>
              <Text style={[styles.creditName, { color: colors.text }]}>Osman G.</Text>
              <Text style={[styles.creditDesc, { color: colors.subText }]}>Yazılım Mimarisi, Frontend, Backend & Veritabanı</Text>
            </View>
          </View>

          {/* Proje Analiz Kartı */}
          <View style={[styles.creditCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.creditIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Cpu size={24} color="#10B981" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={[styles.creditRole, { color: colors.subText }]}>Proje Analiz</Text>
              <Text style={[styles.creditName, { color: colors.text }]}>E. D.</Text>
              <Text style={[styles.creditDesc, { color: colors.subText }]}>Sistem Analizi, Gereksinim Yönetimi & Konsept Tasarımı</Text>
            </View>
          </View>
        </View>

        {/* Yasal Bildirim ve Haklar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Yasal Haklar & Koruma Şartları</Text>
          
          <View style={[styles.legalBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.legalHeader}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.legalTitle, { color: colors.text }]}>Fikri ve Sınai Mülkiyet Açıklaması</Text>
            </View>
            <Text style={[styles.legalText, { color: colors.subText }]}>
              • Tavsi uygulaması bünyesindeki tüm kaynak kodlar, veritabanı mimarisi, kullanıcı arayüzü (UI/UX) tasarımları, grafik unsurlar, algoritmalar ve marka ögeleri 5846 Sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 Sayılı Sınai Mülkiyet Kanunu kapsamında yasal koruma altındadır.
            </Text>
            <Text style={[styles.legalText, { color: colors.subText }]}>
              • Hak sahiplerinin yazılı izni olmaksızın uygulamanın kısmen veya tamamen kopyalanması, çoğaltılması, dağıtılması, türev eserlerinin oluşturulması veya kaynak kodlarının tersine mühendislik (reverse engineering) yoluyla işlenmesi yasaktır.
            </Text>
          </View>
        </View>

        {/* Lisans ve Versiyon Bilgisi */}
        <View style={styles.footerSection}>
          <Award size={20} color={colors.mutedText} />
          <Text style={[styles.footerVersion, { color: colors.subText }]}>Tavsi v1.0.0 (Production Build)</Text>
          <Text style={[styles.footerCopyright, { color: colors.mutedText }]}>© 2026 Tavsi. Tüm Fikri ve Sınai Hakları Saklıdır.</Text>
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
  scrollContent: { paddingBottom: 40 },

  bannerCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  bannerIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  bannerSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  badgeRow: { flexDirection: 'row', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#065F46' },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionDesc: { fontSize: 14, marginBottom: 16 },

  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  creditIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  creditInfo: { flex: 1 },
  creditRole: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  creditName: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  creditDesc: { fontSize: 13 },

  legalBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  legalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  legalTitle: { fontSize: 15, fontWeight: '700' },
  legalText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  footerSection: { alignItems: 'center', marginTop: 12, paddingHorizontal: 20 },
  footerVersion: { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  footerCopyright: { fontSize: 12, textAlign: 'center' },
});
