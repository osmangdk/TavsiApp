import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Settings, Shield, MapPin, Coffee, Stethoscope, Scissors, Navigation, Activity } from 'lucide-react-native';

const CATEGORIES = [
  { id: '1', name: 'Yeme & İçme', count: 12, icon: Coffee, color: '#F59E0B' },
  { id: '2', name: 'Sağlık', count: 4, icon: Stethoscope, color: '#10B981' },
  { id: '3', name: 'Kişisel Bakım', count: 3, icon: Scissors, color: '#EC4899' },
  { id: '4', name: 'Aktivite', count: 5, icon: Activity, color: '#3B82F6' },
];

const RECENT_PLACES = [
  { id: 1, name: 'Trilye Restaurant', category: 'Restoran', location: 'Çankaya' },
  { id: 2, name: 'Dr. Ayşe Yılmaz', category: 'Çocuk Doktoru', location: 'Yenimahalle' },
  { id: 3, name: 'MACFit', category: 'Spor Salonu', location: 'Armada' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>@ahmetyilmaz</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('PrivacyCenter')}>
          <Settings size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profil Bilgileri ve Güven Skoru */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarMock}><Text style={styles.avatarText}>A</Text></View>
            <View style={styles.trustScoreBadge}>
              <Shield size={14} color="#FFF" />
              <Text style={styles.trustScoreText}>98</Text>
            </View>
          </View>
          
          <Text style={styles.name}>Ahmet Yılmaz</Text>
          <Text style={styles.bio}>Yeni yerler keşfetmeyi seven bir Ankaralı.</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>14</Text>
              <Text style={styles.statLabel}>Güvendiği</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>52</Text>
              <Text style={styles.statLabel}>Güvenenler</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Tercihi</Text>
            </View>
          </View>
        </View>

        {/* Tercih Haritasını Aç Butonu */}
        <View style={styles.mapActionContainer}>
          <TouchableOpacity style={styles.mapButton} activeOpacity={0.8}>
            <View style={styles.mapButtonIcon}>
              <Navigation size={24} color="#FFF" />
            </View>
            <View style={styles.mapButtonTextContainer}>
              <Text style={styles.mapButtonTitle}>Güven Haritamı Aç</Text>
              <Text style={styles.mapButtonSubtitle}>Tercihlerini haritada görüntüle</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Kategorilere Göre Tercihler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity key={cat.id} style={styles.categoryCard} activeOpacity={0.7}>
                  <View style={[styles.categoryIconWrapper, { backgroundColor: `${cat.color}15` }]}>
                    <Icon size={24} color={cat.color} />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>{cat.count} Mekan</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Son Eklenenler */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Son Eklenenler</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>Tümünü Gör</Text></TouchableOpacity>
          </View>
          
          <View style={styles.recentList}>
            {RECENT_PLACES.map(place => (
              <View key={place.id} style={styles.recentItem}>
                <View style={styles.recentIconWrapper}>
                  <MapPin size={20} color="#7B2CBF" />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{place.name}</Text>
                  <Text style={styles.recentDetails}>{place.category} • {place.location}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  settingsBtn: { padding: 4 },
  scrollContent: { paddingBottom: 40 },
  
  profileSection: { backgroundColor: '#FFFFFF', paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2, marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarMock: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  trustScoreBadge: { position: 'absolute', bottom: 0, right: -10, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 3, borderColor: '#FFFFFF' },
  trustScoreText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, marginLeft: 4 },
  
  name: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  bio: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  
  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 24, width: '100%' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

  mapActionContainer: { paddingHorizontal: 20, marginBottom: 32 },
  mapButton: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#1E293B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  mapButtonIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  mapButtonTextContainer: { flex: 1 },
  mapButtonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  mapButtonSubtitle: { color: '#94A3B8', fontSize: 13 },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  seeAllText: { color: '#7B2CBF', fontWeight: '700', fontSize: 14 },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  categoryCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  categoryIconWrapper: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  categoryCount: { fontSize: 13, color: '#94A3B8' },

  recentList: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  recentIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  recentDetails: { fontSize: 13, color: '#64748B' },
});
