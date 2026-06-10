import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Search, MapPin, Coffee, Stethoscope, Scissors, Wrench, ChevronRight, Plus } from 'lucide-react-native';

const CATEGORIES = [
  { id: '1', name: 'Restoran & Kafe', icon: Coffee, color: '#F59E0B' },
  { id: '2', name: 'Doktor & Sağlık', icon: Stethoscope, color: '#10B981' },
  { id: '3', name: 'Kişisel Bakım', icon: Scissors, color: '#EC4899' },
  { id: '4', name: 'Usta & Tamirat', icon: Wrench, color: '#3B82F6' },
];

export default function AddPreferenceScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tercih Ekle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Kime veya Nereye Güveniyorsunuz?</Text>
          <Text style={styles.heroSubtitle}>Haritanıza yeni bir mekan veya uzman ekleyin.</Text>

          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Mekan veya kişi adı yazın..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Kategori Seçimi</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity key={cat.id} style={styles.categoryCard} activeOpacity={0.7}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                    <Icon size={24} color={cat.color} />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <ChevronRight size={16} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yakın zamanda ziyaret ettikleriniz</Text>
          
          <TouchableOpacity style={styles.recentItem} activeOpacity={0.7}>
            <View style={styles.recentIconWrapper}>
              <MapPin size={20} color="#7B2CBF" />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>Trilye Restaurant</Text>
              <Text style={styles.recentDetails}>Restoran • Çankaya</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.recentItem} activeOpacity={0.7}>
            <View style={styles.recentIconWrapper}>
              <MapPin size={20} color="#7B2CBF" />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>MACFit Armada</Text>
              <Text style={styles.recentDetails}>Spor Salonu • Yenimahalle</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { paddingBottom: 40 },

  heroSection: { paddingHorizontal: 20, marginBottom: 32, marginTop: 10 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 24 },
  
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#7B2CBF', borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B', outlineStyle: 'none' },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  
  categoriesGrid: { gap: 12 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  categoryIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },

  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  recentIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  recentDetails: { fontSize: 13, color: '#64748B' },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
});
