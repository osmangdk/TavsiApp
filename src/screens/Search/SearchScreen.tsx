import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Search, MapPin, Filter, TrendingUp, Users, Heart, Coffee, Stethoscope, Briefcase, GraduationCap, Map as MapIcon, List } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MapComponent, { MapPlace } from '../../components/MapComponent';

const CATEGORIES = [
  { id: '1', name: 'Yeme İçme', icon: Coffee, color: '#F59E0B' },
  { id: '2', name: 'Sağlık', icon: Stethoscope, color: '#10B981' },
  { id: '3', name: 'Eğitim', icon: GraduationCap, color: '#3B82F6' },
  { id: '4', name: 'Hizmetler', icon: Briefcase, color: '#8B5CF6' },
];

const FILTERS = ['Tümü', 'Sadece Güvendiklerim', '2. Derece Ağım', 'Yakınımda'];

const TRENDING_SEARCHES = [
  'Çocuk Doktoru', 'İtalyan Restoranı', 'Pilates Salonu', 'Güvenilir Tesisatçı'
];

export default function SearchScreen() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapPlaces, setMapPlaces] = useState<MapPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'map') {
      fetchMapPlaces();
    }
  }, [viewMode]);

  const fetchMapPlaces = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      // 1. Get connections
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', session.user.id)
        .eq('status', 'accepted');
        
      const followingIds = connections?.map(c => c.following_id) || [];
      const userIdsToFetch = [...followingIds, session.user.id];

      // 2. Get places
      const { data: userPlaces, error } = await supabase
        .from('user_places')
        .select(`
          id,
          rating,
          review_text,
          profiles:user_id (full_name),
          places!inner (
             osm_id, name, category, latitude, longitude
          )
        `)
        .in('user_id', userIdsToFetch);

      if (error) {
        console.error("Map places fetch error:", error);
      } else if (userPlaces) {
        // Map to MapPlace format
        const formattedPlaces: MapPlace[] = userPlaces
          .filter(up => up.places && up.places.latitude && up.places.longitude) // Sadece koordinatı olanlar
          .map((up: any) => ({
            id: up.id,
            name: up.places.name,
            category: up.places.category || 'Mekan',
            rating: up.rating || 0,
            latitude: up.places.latitude,
            longitude: up.places.longitude,
            recommendedBy: up.profiles?.full_name || 'Bilinmiyor',
            reviewText: up.review_text
          }));
        
        setMapPlaces(formattedPlaces);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keşfet</Text>
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={18} color={viewMode === 'list' ? '#FFF' : '#64748B'} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <MapIcon size={18} color={viewMode === 'map' ? '#FFF' : '#64748B'} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Harita</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ağınızda mekan veya uzman arayın..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 50 }} />
          ) : (
            <MapComponent places={mapPlaces} />
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hızlı Filtreler (Chips) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((filter, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Kategoriler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                      <Icon size={24} color={cat.color} />
                    </View>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Popüler Aramalar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ağınızda Popüler Aramalar</Text>
            <View style={styles.trendingContainer}>
              {TRENDING_SEARCHES.map((term, index) => (
                <TouchableOpacity key={index} style={styles.trendingItem}>
                  <TrendingUp size={16} color="#7B2CBF" style={{ marginRight: 8 }} />
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ağımda Öne Çıkanlar (Örnek Mekan Kartları) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ağınızda Öne Çıkanlar</Text>
            
            <TouchableOpacity style={styles.placeCard} activeOpacity={0.8}>
              <View style={styles.placeHeader}>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>Paper Roasting Coffee</Text>
                  <Text style={styles.placeCategory}>Kafe • Çankaya</Text>
                </View>
                <View style={styles.trustCountBadge}>
                  <Users size={14} color="#7B2CBF" />
                  <Text style={styles.trustCountText}>12 Bağlantı</Text>
                </View>
              </View>
              
              <View style={styles.friendsContainer}>
                <View style={styles.friendsAvatars}>
                  <View style={[styles.avatarMicro, { backgroundColor: '#F43F5E', zIndex: 3 }]}><Text style={styles.avatarMicroText}>A</Text></View>
                  <View style={[styles.avatarMicro, { backgroundColor: '#3B82F6', zIndex: 2, marginLeft: -10 }]}><Text style={styles.avatarMicroText}>M</Text></View>
                  <View style={[styles.avatarMicro, { backgroundColor: '#10B981', zIndex: 1, marginLeft: -10 }]}><Text style={styles.avatarMicroText}>K</Text></View>
                </View>
                <Text style={styles.friendsText}>Ayşe, Mustafa ve 10 kişi daha buraya güveniyor.</Text>
              </View>
            </TouchableOpacity>

          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  
  viewToggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: '#7B2CBF' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  toggleTextActive: { color: '#FFFFFF' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 52, marginRight: 12 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', outlineStyle: 'none' },
  filterBtn: { width: 52, height: 52, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  mapContainer: { flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8F9FA' },

  scrollContent: { paddingBottom: 40 },
  
  filterScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  categoryCard: { width: '47%', backgroundColor: '#F8F9FA', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  trendingContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(123, 44, 191, 0.05)', borderWidth: 1, borderColor: 'rgba(123, 44, 191, 0.1)' },
  trendingText: { fontSize: 14, fontWeight: '600', color: '#7B2CBF' },

  placeCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  placeCategory: { fontSize: 14, color: '#64748B' },
  trustCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  trustCountText: { fontSize: 12, fontWeight: '700', color: '#7B2CBF', marginLeft: 4 },
  
  friendsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 16 },
  friendsAvatars: { flexDirection: 'row', marginRight: 12 },
  avatarMicro: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarMicroText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  friendsText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
});
