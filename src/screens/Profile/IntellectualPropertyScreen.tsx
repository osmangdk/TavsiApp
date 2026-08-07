import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Code, Cpu, Award, FileText, CheckCircle2 } from 'lucide-react-native';

export default function IntellectualPropertyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fikri ve Sınai Haklar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconWrapper}>
            <Shield size={32} color="#7B2CBF" />
          </View>
          <Text style={styles.bannerTitle}>Tüm Hakları Saklıdır</Text>
          <Text style={styles.bannerSubtitle}>
            Tavsi mobil & web uygulamasının tüm fikri, sınai, yazılımsal ve tasarımsal hakları koruma altındadır.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={styles.badgeText}>Resmi Telif Bildirimi</Text>
            </View>
          </View>
        </View>

        {/* Proje Künyesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proje Künyesi</Text>
          <Text style={styles.sectionDesc}>Tavsi platformunun geliştirilmesi ve analiz süreçlerinde emeği geçenler:</Text>

          {/* Geliştirici Kartı */}
          <View style={styles.creditCard}>
            <View style={[styles.creditIconWrapper, { backgroundColor: 'rgba(123, 44, 191, 0.1)' }]}>
              <Code size={24} color="#7B2CBF" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditRole}>Geliştirici</Text>
              <Text style={styles.creditName}>Osman G.</Text>
              <Text style={styles.creditDesc}>Yazılım Mimarisi, Frontend, Backend & Veritabanı</Text>
            </View>
          </View>

          {/* Proje Analiz Kartı */}
          <View style={styles.creditCard}>
            <View style={[styles.creditIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Cpu size={24} color="#10B981" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditRole}>Proje Analiz</Text>
              <Text style={styles.creditName}>E. D.</Text>
              <Text style={styles.creditDesc}>Sistem Analizi, Gereksinim Yönetimi & Konsept Tasarımı</Text>
            </View>
          </View>
        </View>

        {/* Yasal Bildirim ve Haklar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yasal Haklar & Koruma Şartları</Text>
          
          <View style={styles.legalBox}>
            <View style={styles.legalHeader}>
              <FileText size={20} color="#7B2CBF" />
              <Text style={styles.legalTitle}>Fikri ve Sınai Mülkiyet Açıklaması</Text>
            </View>
            <Text style={styles.legalText}>
              • Tavsi uygulaması bünyesindeki tüm kaynak kodlar, veritabanı mimarisi, kullanıcı arayüzü (UI/UX) tasarımları, grafik unsurlar, algoritmalar ve marka ögeleri 5846 Sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 Sayılı Sınai Mülkiyet Kanunu kapsamında yasal koruma altındadır.
            </Text>
            <Text style={styles.legalText}>
              • Hak sahiplerinin yazılı izni olmaksızın uygulamanın kısmen veya tamamen kopyalanması, çoğaltılması, dağıtılması, türev eserlerinin oluşturulması veya kaynak kodlarının tersine mühendislik (reverse engineering) yoluyla işlenmesi yasaktır.
            </Text>
          </View>
        </View>

        {/* Lisans ve Versiyon Bilgisi */}
        <View style={styles.footerSection}>
          <Award size={20} color="#94A3B8" />
          <Text style={styles.footerVersion}>Tavsi v1.0.0 (Production Build)</Text>
          <Text style={styles.footerCopyright}>© 2026 Tavsi. Tüm Fikri ve Sınai Hakları Saklıdır.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justify: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { paddingBottom: 40 },

  bannerCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: 'rgba(123, 44, 191, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  bannerSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
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
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#64748B', marginBottom: 16 },

  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  creditRole: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 },
  creditName: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  creditDesc: { fontSize: 13, color: '#64748B' },

  legalBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  legalTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  legalText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 12 },

  footerSection: { alignItems: 'center', marginTop: 12, paddingHorizontal: 20 },
  footerVersion: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 8, marginBottom: 4 },
  footerCopyright: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});
