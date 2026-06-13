import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, MapPin, Check, Plus, ArrowRight, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

// Türkiye İl/İlçe Mock Verisi
const LOCATIONS = [
  {
    id: 1,
    city: 'Ankara',
    districts: ['Çankaya', 'Yenimahalle', 'Keçiören', 'Etimesgut']
  },
  {
    id: 2,
    city: 'İstanbul',
    districts: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Maltepe']
  },
  {
    id: 3,
    city: 'İzmir',
    districts: ['Bornova', 'Karşıyaka', 'Konak', 'Buca']
  }
];

// Mock Google Places API verisi
const ALL_MOCK_PLACES = [
  { id: 1, name: 'Trilye Restaurant', category: 'Restoran', city: 'Ankara', district: 'Çankaya', rating: 4.8 },
  { id: 2, name: 'Dr. Ayşe Yılmaz', category: 'Çocuk Doktoru', city: 'Ankara', district: 'Yenimahalle', rating: 4.9 },
  { id: 3, name: 'Paper Roasting Coffee', category: 'Kafe', city: 'Ankara', district: 'Çankaya', rating: 4.7 },
  { id: 4, name: 'MACFit Armada', category: 'Spor Salonu', city: 'Ankara', district: 'Yenimahalle', rating: 4.5 },
  { id: 5, name: 'Wall Street English', category: 'Yabancı Dil Kursu', city: 'Ankara', district: 'Çankaya', rating: 4.6 },
  { id: 6, name: 'Moda Sahil Kahvecisi', category: 'Kafe', city: 'İstanbul', district: 'Kadıköy', rating: 4.8 },
  { id: 7, name: 'Acıbadem Hastanesi', category: 'Hastane', city: 'İstanbul', district: 'Kadıköy', rating: 4.7 },
  { id: 8, name: 'Kordon Balıkçısı', category: 'Restoran', city: 'İzmir', district: 'Konak', rating: 4.5 },
];

export default function MandatoryPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState<any[]>([]);
  
  // İl / İlçe State'leri
  const [selectedCity, setSelectedCity] = useState('İl Seçin');
  const [selectedDistrict, setSelectedDistrict] = useState('İlçe Seçin');
  
  // Modal State'leri
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [isDistrictModalVisible, setDistrictModalVisible] = useState(false);

  // API State'leri
  const [searchResults, setSearchResults] = useState<any[]>(ALL_MOCK_PLACES);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePreferences = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    
    try {
      for (const place of selectedPrefs) {
        // 1. Mekanı places tablosuna ekle (veya varsa ID'sini al)
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .upsert({
            osm_id: place.id.toString(), // Mock ise id'ler int, toString yapıyoruz
            name: place.name,
            category: place.category,
            city: place.city,
            district: place.district
          }, { onConflict: 'osm_id' })
          .select()
          .single();
          
        if (placeError || !placeData) {
          console.error("Mekan ekleme hatası:", placeError);
          continue;
        }

        // 2. Kullanıcının tercihi olarak user_places tablosuna bağla
        await supabase
          .from('user_places')
          .upsert({
            user_id: session.user.id,
            place_id: placeData.id
          }, { onConflict: 'user_id, place_id' });
      }
      
      // Başarıyla kaydedildi, ana sekmelere geç
      navigation.navigate('MainTabs');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Tercihleriniz kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // === FOURSQUARE API ENTEGRASYONU ===
  // Mekan arama altyapısı
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchFoursquare(searchQuery);
      } else {
        // Arama boşsa, kullanıcının seçtiği İl/İlçeye göre "Popüler Önerileri" filtrele
        const filteredRecommended = ALL_MOCK_PLACES.filter(place => {
          const matchesCity = selectedCity === 'İl Seçin' || place.city === selectedCity;
          const matchesDistrict = selectedDistrict === 'İlçe Seçin' || place.district === selectedDistrict;
          return matchesCity && matchesDistrict;
        });
        setSearchResults(filteredRecommended);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCity, selectedDistrict]);

  const searchFoursquare = async (query: string) => {
    setIsSearching(true);
    try {
      let near = 'Türkiye';
      if (selectedCity !== 'İl Seçin') {
        near = selectedCity + ', Türkiye';
        if (selectedDistrict !== 'İlçe Seçin') {
          near = selectedDistrict + ', ' + selectedCity + ', Türkiye';
        }
      }

      const response = await fetch(
        `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&near=${encodeURIComponent(near)}&limit=10`,
        {
          headers: {
            'Authorization': 'F5NUFOMY0XPN13SVB0SINGXGIHSMTVSCJ3US1BT5FZKZQ1GB',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const formattedResults = data.results.map((place: any) => {
          return {
            id: place.fsq_id,
            name: place.name,
            category: place.categories && place.categories.length > 0 ? place.categories[0].name : 'Mekan',
            city: place.location?.region || selectedCity,
            district: place.location?.locality || selectedDistrict,
            rating: place.rating || 0 
          };
        });
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]); // Sonuç bulunamadı
      }
    } catch (error) {
      console.error("Foursquare API Hatası:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const filterMockPlaces = (query: string) => {
    const filtered = ALL_MOCK_PLACES.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(query.toLowerCase()) || place.category.toLowerCase().includes(query.toLowerCase());
      const matchesCity = selectedCity === 'İl Seçin' || place.city === selectedCity;
      const matchesDistrict = selectedDistrict === 'İlçe Seçin' || place.district === selectedDistrict;
      return matchesSearch && matchesCity && matchesDistrict;
    });
    setSearchResults(filtered);
  };

  const togglePref = (place: any) => {
    if (selectedPrefs.find(p => p.id === place.id)) {
      setSelectedPrefs(selectedPrefs.filter(p => p.id !== place.id));
    } else {
      setSelectedPrefs([...selectedPrefs, place]);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('İlçe Seçin'); // İl değiştiğinde ilçeyi sıfırla
    setCityModalVisible(false);
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setDistrictModalVisible(false);
  };

  const isComplete = selectedPrefs.length >= 3;

  // Şu anki seçili ilin ilçelerini bul
  const currentDistricts = LOCATIONS.find(loc => loc.city === selectedCity)?.districts || [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Tercihlerinizi Ekleyin</Text>
          <Text style={styles.subtitle}>Tavsi'ye başlamak için en az 3 güvendiğiniz mekanı veya uzmanı ekleyin.</Text>
        </View>

        {/* İl / İlçe ve Arama Barı */}
        <View style={styles.searchSection}>
          <View style={styles.locationFilters}>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setCityModalVisible(true)}>
              <MapPin size={16} color="#7B2CBF" />
              <Text style={[styles.filterText, selectedCity === 'İl Seçin' && { color: '#94A3B8' }]}>
                {selectedCity}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterBtn, selectedCity === 'İl Seçin' && { opacity: 0.5 }]} 
              onPress={() => selectedCity !== 'İl Seçin' && setDistrictModalVisible(true)}
              disabled={selectedCity === 'İl Seçin'}
            >
              <Text style={[styles.filterText, selectedDistrict === 'İlçe Seçin' && { color: '#94A3B8' }]}>
                {selectedDistrict}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Mekan, doktor veya kategori ara..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Seçilen Tercihler */}
        {selectedPrefs.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedTitle}>Eklenenler ({selectedPrefs.length}/3):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedScroll}>
              {selectedPrefs.map(pref => (
                <View key={pref.id} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{pref.name}</Text>
                  <TouchableOpacity onPress={() => togglePref(pref)} style={styles.removeChip}>
                    <X size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Arama Sonuçları */}
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          
          {/* Dinamik Liste Başlığı */}
          {searchResults.length > 0 && (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12, paddingHorizontal: 4 }}>
              {searchQuery.length > 2 ? 'Arama Sonuçları' : (selectedCity !== 'İl Seçin' ? `${selectedCity} İçin Önerilenler` : 'Popüler Mekanlar')}
            </Text>
          )}

          {searchResults.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8' }}>Sonuç bulunamadı.</Text>
            </View>
          ) : (
            searchResults.map((place) => {
              const isSelected = selectedPrefs.find(p => p.id === place.id);
              return (
                <TouchableOpacity
                  key={place.id}
                  onPress={() => togglePref(place)}
                  activeOpacity={0.7}
                  style={[styles.resultItem, isSelected && styles.resultItemSelected]}
                >
                  <View style={styles.resultIconWrapper}>
                    <MapPin size={24} color={isSelected ? '#7B2CBF' : '#94A3B8'} />
                  </View>
                  
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultDetails}>{place.category} • {place.district}, {place.city}</Text>
                  </View>

                  <View style={[styles.actionBtn, isSelected ? styles.actionBtnSelected : null]}>
                    {isSelected ? <Check size={18} color="#FFF" /> : <Plus size={18} color="#7B2CBF" />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Alt Devam Butonu */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueBtn, isComplete && !isSaving ? styles.continueBtnActive : styles.continueBtnInactive]}
            onPress={handleSavePreferences}
            activeOpacity={0.8}
            disabled={!isComplete || isSaving}
          >
            <Text style={styles.continueBtnText}>{isSaving ? 'Kaydediliyor...' : "Tavsi'yi Kullanmaya Başla"}</Text>
            {!isSaving && <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* İL SEÇİM MODALI */}
      <Modal visible={isCityModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İl Seçin</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalItem} onPress={() => handleCitySelect('İl Seçin')}>
              <Text style={[styles.modalItemText, selectedCity === 'İl Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Tüm İller (Filtreyi Temizle)</Text>
            </TouchableOpacity>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity key={loc.id} style={styles.modalItem} onPress={() => handleCitySelect(loc.city)}>
                <Text style={[styles.modalItemText, selectedCity === loc.city && { color: '#7B2CBF', fontWeight: 'bold' }]}>{loc.city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* İLÇE SEÇİM MODALI */}
      <Modal visible={isDistrictModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCity} - İlçe Seçin</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalItem} onPress={() => handleDistrictSelect('İlçe Seçin')}>
              <Text style={[styles.modalItemText, selectedDistrict === 'İlçe Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Tüm İlçeler (Filtreyi Temizle)</Text>
            </TouchableOpacity>
            {currentDistricts.map((district, index) => (
              <TouchableOpacity key={index} style={styles.modalItem} onPress={() => handleDistrictSelect(district)}>
                <Text style={[styles.modalItemText, selectedDistrict === district && { color: '#7B2CBF', fontWeight: 'bold' }]}>{district}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  locationFilters: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  filterText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', outlineStyle: 'none' },
  selectedSection: { paddingVertical: 12, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  selectedTitle: { paddingHorizontal: 20, fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  selectedScroll: { paddingHorizontal: 16, gap: 8 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7B2CBF', borderRadius: 20, paddingVertical: 6, paddingLeft: 12, paddingRight: 6, marginHorizontal: 4 },
  selectedChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginRight: 6 },
  removeChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 2 },
  resultsContainer: { flex: 1, paddingHorizontal: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultItemSelected: { backgroundColor: 'rgba(123, 44, 191, 0.03)', borderRadius: 12, paddingHorizontal: 12, marginHorizontal: -12 },
  resultIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  resultDetails: { fontSize: 13, color: '#64748B' },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnSelected: { backgroundColor: '#10B981', borderColor: '#10B981' },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  continueBtnActive: { backgroundColor: '#7B2CBF' },
  continueBtnInactive: { backgroundColor: '#D8B4E2' },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 16, color: '#1E293B' },
});
