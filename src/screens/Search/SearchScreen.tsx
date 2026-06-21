import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Search, MapPin, X, TrendingUp, Users, Coffee, Stethoscope, Scissors, Wrench, Map as MapIcon, List } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MapComponent, { MapPlace } from '../../components/MapComponent';

const CATEGORIES = [
  { id: '1', name: 'Yeme İçme', emoji: '🍽️', color: '#F59E0B', keywords: ['restaurant', 'cafe', 'fast_food', 'yemek', 'kafe', 'restoran'] },
  { id: '2', name: 'Sağlık', emoji: '🏥', color: '#10B981', keywords: ['hospital', 'clinic', 'pharmacy', 'doktor', 'eczane'] },
  { id: '3', name: 'Kişisel Bakım', emoji: '✂️', color: '#EC4899', keywords: ['barber', 'beauty', 'salon', 'berber', 'kuaför'] },
  { id: '4', name: 'Hizmetler', emoji: '🔧', color: '#8B5CF6', keywords: ['service', 'repair', 'tamirat', 'usta'] },
];

const FILTERS = ['Tümü', 'Sadece Güvendiklerim', 'Yakınımda'];
const TRENDING_SEARCHES = ['Çocuk Doktoru', 'İtalyan Restoranı', 'Pilates Salonu', 'Güvenilir Tesisatçı'];

export default function SearchScreen() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapPlaces, setMapPlaces] = useState<MapPlace[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'map') fetchMapPlaces();
  }, [viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) searchPlaces(searchQuery);
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  const fetchMapPlaces = async () => {
    if (!session?.user?.id) return;
    setIsMapLoading(true);
    try {
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', session.user.id)
        .eq('status', 'accepted');
        
      const followingIds = connections?.map(c => c.following_id) || [];
      const userIdsToFetch = [...followingIds, session.user.id];

      const { data: userPlaces } = await supabase
        .from('user_places')
        .select(`id, rating, review_text, profiles:user_id (full_name), places!inner (osm_id, name, category, latitude, longitude)`)
        .in('user_id', userIdsToFetch);

      if (userPlaces) {
        const formattedPlaces: MapPlace[] = userPlaces
          .filter((up: any) => up.places?.latitude && up.places?.longitude)
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
      setIsMapLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    setIsLoading(true);
    try {
      let results: any[] = [];

      if (activeFilter === 'Sadece Güvendiklerim') {
        // Sadece bağlantıların mekanlarını ara
        const { data: connections } = await supabase
          .from('connections')
          .select('following_id')
          .eq('follower_id', session!.user.id)
          .eq('status', 'accepted');
        const ids = connections?.map(c => c.following_id) || [];

        const { data } = await supabase
          .from('user_places')
          .select(`id, rating, review_text, profiles:user_id (full_name, username), places!inner (id, name, category, district, city)`)
          .in('user_id', ids)
          .ilike('places.name', `%${query}%`);

        if (data) {
          results = data.map((item: any) => ({
            id: item.id,
            name: item.places?.name,
            category: item.places?.category,
            location: `${item.places?.district || ''}, ${item.places?.city || ''}`,
            rating: item.rating,
            recommendedBy: item.profiles?.full_name,
          })).filter(r => r.name);
        }
      } else {
        // Önce kendi DB'de ara
        const { data: dbResults } = await supabase
          .from('places')
          .select('id, name, category, district, city')
          .ilike('name', `%${query}%`)
          .limit(8);

        if (dbResults) {
          results = dbResults.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            location: `${p.district || ''}, ${p.city || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
          }));
        }

        // Sonra Photon API ile açık kaynak OSM araması
        const photonQuery = encodeURIComponent(query + ' Türkiye');
        const response = await fetch(`https://photon.komoot.io/api/?q=${photonQuery}&limit=10`);
        const photonData = await response.json();

        if (photonData?.features) {
          const existingIds = new Set(results.map(r => String(r.id)));
          photonData.features.forEach((f: any) => {
            if (!f.properties?.name) return;
            const osmId = String(f.properties.osm_id);
            if (!existingIds.has(osmId)) {
              const osmVal = f.properties.osm_value || '';
              let cat = 'Mekan';
              if (['restaurant', 'cafe', 'fast_food', 'bar', 'bakery'].includes(osmVal)) cat = 'Yeme & İçme';
              else if (['hospital', 'clinic', 'pharmacy', 'doctors'].includes(osmVal)) cat = 'Sağlık';
              else if (['beauty', 'hairdresser', 'barber'].includes(osmVal)) cat = 'Kişisel Bakım';
              
              results.push({
                id: osmId,
                name: f.properties.name,
                category: cat,
                location: [f.properties.district, f.properties.state].filter(Boolean).join(', '),
              });
              existingIds.add(osmId);
            }
          });
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (cat: typeof CATEGORIES[0]) => {
    setSearchQuery(cat.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keşfet</Text>
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} onPress={() => setViewMode('list')}>
            <List size={18} color={viewMode === 'list' ? '#FFF' : '#64748B'} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]} onPress={() => setViewMode('map')}>
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
            placeholder="Mekan veya uzman arayın..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {isMapLoading ? <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 50 }} /> : <MapComponent places={mapPlaces} />}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Filtreler */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((filter, index) => (
              <TouchableOpacity key={index} style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]} onPress={() => setActiveFilter(filter)}>
                <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Arama Sonuçları */}
          {searchQuery.length > 2 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sonuçlar</Text>
              {isLoading ? (
                <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 20 }} />
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>"{searchQuery}" için sonuç bulunamadı.</Text>
                </View>
              ) : (
                searchResults.map((place, i) => (
                  <View key={place.id || i} style={styles.resultItem}>
                    <View style={styles.resultIconWrapper}>
                      <MapPin size={20} color="#7B2CBF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{place.name}</Text>
                      <Text style={styles.resultDetails}>
                        {place.category}{place.location ? ` • ${place.location}` : ''}
                        {place.recommendedBy ? ` • 👤 ${place.recommendedBy}` : ''}
                      </Text>
                    </View>
                    {place.rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {place.rating}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          ) : (
            <>
              {/* Kategoriler */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kategoriler</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.id} style={styles.categoryCard} onPress={() => handleCategoryPress(cat)}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Trend Aramalar */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popüler Aramalar</Text>
                <View style={styles.trendingContainer}>
                  {TRENDING_SEARCHES.map((term, index) => (
                    <TouchableOpacity key={index} style={styles.trendingItem} onPress={() => setSearchQuery(term)}>
                      <TrendingUp size={16} color="#7B2CBF" style={{ marginRight: 8 }} />
                      <Text style={styles.trendingText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  viewToggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: '#7B2CBF' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  toggleTextActive: { color: '#FFFFFF' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', outlineStyle: 'none' } as any,
  mapContainer: { flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContent: { paddingBottom: 40 },
  filterScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  categoryCard: { width: '47%', backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  trendingContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(123,44,191,0.05)', borderWidth: 1, borderColor: 'rgba(123,44,191,0.1)' },
  trendingText: { fontSize: 14, fontWeight: '600', color: '#7B2CBF' },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  resultDetails: { fontSize: 13, color: '#64748B' },
  ratingBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
});
