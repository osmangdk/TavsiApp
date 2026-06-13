import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, MapPin, Check, Plus, ArrowRight, X, ChevronDown, Star } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';



// Mock veriler kaldırıldı, artık doğrudan veritabanından çekilecek.

export default function MandatoryPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState<any[]>([]);
  
  // İl / İlçe / Mahalle State'leri
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

  const [selectedCity, setSelectedCity] = useState('İl Seçin');
  const [selectedDistrict, setSelectedDistrict] = useState('İlçe Seçin');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Mahalle Seçin (Opsiyonel)');
  
  // Modal State'leri
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [isDistrictModalVisible, setDistrictModalVisible] = useState(false);
  const [isNeighborhoodModalVisible, setNeighborhoodModalVisible] = useState(false);

  // Kategori / Alt Kategori State'leri
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('Kategori Seçin');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Alt Kategori Seçin');

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSubcategoryModalVisible, setSubcategoryModalVisible] = useState(false);

  // Lokasyonları Supabase'den Çek
  React.useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from('cities').select('*').order('name');
      if (data) setCities(data);
    };
    fetchCities();
  }, []);

  React.useEffect(() => {
    if (selectedCityId) {
      const fetchDistricts = async () => {
        const { data } = await supabase.from('districts').select('*').eq('city_id', selectedCityId).order('name');
        if (data) setDistricts(data);
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [selectedCityId]);

  React.useEffect(() => {
    if (selectedDistrictId) {
      const fetchNeighborhoods = async () => {
        const { data } = await supabase.from('neighborhoods').select('*').eq('district_id', selectedDistrictId).order('name');
        if (data) setNeighborhoods(data);
      };
      fetchNeighborhoods();
    } else {
      setNeighborhoods([]);
    }
  }, [selectedDistrictId]);
  
  // Kategorileri Supabase'den Çek
  React.useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubcategories = async () => {
        const { data } = await supabase.from('subcategories').select('*').eq('category_id', selectedCategoryId).order('name');
        if (data) setSubcategories(data);
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);
  
  // Özel Mekan Modal State'leri
  const [isCustomPlaceModalVisible, setCustomPlaceModalVisible] = useState(false);
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [customPlaceCategory, setCustomPlaceCategory] = useState('');
  const [customPlaceCity, setCustomPlaceCity] = useState('');
  const [customPlaceDistrict, setCustomPlaceDistrict] = useState('');
  const [customPlaceNeighborhood, setCustomPlaceNeighborhood] = useState('');

  // API State'leri
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Değerlendirme (Review) Modal State'leri
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentPlaceToReview, setCurrentPlaceToReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewVisibility, setReviewVisibility] = useState('network'); // 'public', 'network', 'custom'

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
            place_id: placeData.id,
            rating: place.rating || 0,
            review_text: place.review_text || null,
            visibility: place.visibility || 'network'
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
      } else if (selectedSubcategory !== 'Alt Kategori Seçin') {
        // Kullanıcı arama yazmamış ama bir alt kategori seçmişse Foursquare'de onu ara
        searchFoursquare(selectedSubcategory);
      } else {
        // Arama boşsa, veritabanından popüler/eklenen mekanları getir
        fetchPopularPlaces();
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCity, selectedDistrict, selectedNeighborhood, selectedSubcategory]);

  const fetchPopularPlaces = async () => {
    try {
      let query = supabase.from('places').select('*').limit(20);
      
      if (selectedCity !== 'İl Seçin') {
        query = query.eq('city', selectedCity);
      }
      if (selectedDistrict !== 'İlçe Seçin') {
        query = query.eq('district', selectedDistrict);
      }
      if (selectedSubcategory !== 'Alt Kategori Seçin') {
        query = query.ilike('category', `%${selectedSubcategory}%`);
      } else if (selectedCategory !== 'Kategori Seçin') {
        // Sadece kategori seçilmişse, popüler mekanlarda tam eşleşme bulması zor olabilir 
        // ancak manuel girilmişse category alanında saklıyor olabiliriz
        query = query.ilike('category', `%${selectedCategory}%`);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        const formatted = data.map((p: any) => ({
          id: p.osm_id || p.id,
          name: p.name,
          category: p.category,
          city: p.city,
          district: p.district,
          rating: p.rating || 0 // Eğer ileride rating sütunu eklenirse oyu yüksek olanları öne alır
        }));
        
        // Puanı yüksek olanları öne al
        formatted.sort((a, b) => b.rating - a.rating);
        setSearchResults(formatted);
      }
    } catch (error) {
      console.log("Popüler mekanları çekerken hata:", error);
    }
  };

  const searchFoursquare = async (query: string) => {
    setIsSearching(true);
    try {
      let near = 'Türkiye';
      if (selectedCity !== 'İl Seçin') {
        near = selectedCity + ', Türkiye';
        if (selectedDistrict !== 'İlçe Seçin') {
          near = selectedDistrict + ', ' + selectedCity + ', Türkiye';
          // Mahalle filtresi Foursquare'in kafasını karıştırdığı için sadece İl/İlçe gönderiyoruz
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

  const handleSelectPlace = (place: any) => {
    if (selectedPrefs.find(p => p.id === place.id)) {
      setSelectedPrefs(selectedPrefs.filter(p => p.id !== place.id));
    } else {
      setCurrentPlaceToReview(place);
      setReviewRating(0);
      setReviewText('');
      setReviewVisibility('network');
      setReviewModalVisible(true);
    }
  };

  const handleSaveReview = () => {
    if (reviewRating === 0) {
      Alert.alert('Eksik Bilgi', 'Lütfen mekana 1 ile 5 arası bir yıldız verin.');
      return;
    }
    
    const placeWithReview = {
      ...currentPlaceToReview,
      rating: reviewRating,
      review_text: reviewText,
      visibility: reviewVisibility,
    };
    
    setSelectedPrefs([...selectedPrefs, placeWithReview]);
    setReviewModalVisible(false);
    setCurrentPlaceToReview(null);
  };

  const handleCitySelect = (cityId: number | null, cityName: string) => {
    setSelectedCityId(cityId);
    setSelectedCity(cityName);
    setSelectedDistrictId(null);
    setSelectedDistrict('İlçe Seçin');
    setSelectedNeighborhood('Mahalle Seçin (Opsiyonel)');
    setCityModalVisible(false);
  };

  const handleDistrictSelect = (districtId: number | null, districtName: string) => {
    setSelectedDistrictId(districtId);
    setSelectedDistrict(districtName);
    setSelectedNeighborhood('Mahalle Seçin (Opsiyonel)');
    setDistrictModalVisible(false);
  };

  const handleNeighborhoodSelect = (neighborhoodName: string) => {
    setSelectedNeighborhood(neighborhoodName);
    setNeighborhoodModalVisible(false);
  };

  const openCustomPlaceModal = () => {
    setCustomPlaceName(searchQuery);
    setCustomPlaceCity(selectedCity !== 'İl Seçin' ? selectedCity : '');
    setCustomPlaceDistrict(selectedDistrict !== 'İlçe Seçin' ? selectedDistrict : '');
    setCustomPlaceNeighborhood(selectedNeighborhood !== 'Mahalle Seçin (Opsiyonel)' ? selectedNeighborhood : '');
    setCustomPlaceCategory(selectedSubcategory !== 'Alt Kategori Seçin' ? selectedSubcategory : (selectedCategory !== 'Kategori Seçin' ? selectedCategory : ''));
    setCustomPlaceModalVisible(true);
  };

  const handleCategorySelect = (categoryId: number | null, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategory(categoryName);
    setSelectedSubcategoryId(null);
    setSelectedSubcategory('Alt Kategori Seçin');
    setCategoryModalVisible(false);
  };

  const handleSubcategorySelect = (subcategoryId: number | null, subcategoryName: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setSelectedSubcategory(subcategoryName);
    setSubcategoryModalVisible(false);
  };

  const handleAddCustomPlace = () => {
    if (!customPlaceName || !customPlaceCategory || !customPlaceCity || !customPlaceDistrict) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    
    const newPlace = {
      id: 'custom_' + Date.now(),
      name: customPlaceName,
      category: customPlaceCategory,
      city: customPlaceCity,
      district: customPlaceDistrict,
      rating: 0
    };
    
    setCustomPlaceModalVisible(false);
    
    // Yorum modalını açmak için kısa bir gecikme ekleyelim (iOS/Android çakışmalarını önlemek için)
    setTimeout(() => {
      setCurrentPlaceToReview(newPlace);
      setReviewRating(0);
      setReviewText('');
      setReviewVisibility('network');
      setReviewModalVisible(true);
    }, 500);
    
    setSearchQuery(''); // Arama barını temizle
  };

  const isComplete = selectedPrefs.length >= 3;

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
              <Text style={[styles.filterText, selectedCity === 'İl Seçin' && { color: '#94A3B8' }]} numberOfLines={1}>
                {selectedCity}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterBtn, selectedCity === 'İl Seçin' && { opacity: 0.5 }]} 
              onPress={() => selectedCity !== 'İl Seçin' && setDistrictModalVisible(true)}
              disabled={selectedCity === 'İl Seçin'}
            >
              <Text style={[styles.filterText, selectedDistrict === 'İlçe Seçin' && { color: '#94A3B8' }]} numberOfLines={1}>
                {selectedDistrict}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterBtn, selectedDistrict === 'İlçe Seçin' && { opacity: 0.5 }]} 
              onPress={() => selectedDistrict !== 'İlçe Seçin' && setNeighborhoodModalVisible(true)}
              disabled={selectedDistrict === 'İlçe Seçin'}
            >
              <Text style={[styles.filterText, selectedNeighborhood === 'Mahalle Seçin (Opsiyonel)' && { color: '#94A3B8' }]} numberOfLines={1}>
                {selectedNeighborhood === 'Mahalle Seçin (Opsiyonel)' ? 'Mahalle' : selectedNeighborhood}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryFilters}>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setCategoryModalVisible(true)}>
              <Text style={[styles.filterText, selectedCategory === 'Kategori Seçin' && { color: '#94A3B8' }]} numberOfLines={1}>
                {selectedCategory}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterBtn, selectedCategory === 'Kategori Seçin' && { opacity: 0.5 }]} 
              onPress={() => selectedCategory !== 'Kategori Seçin' && setSubcategoryModalVisible(true)}
              disabled={selectedCategory === 'Kategori Seçin'}
            >
              <Text style={[styles.filterText, selectedSubcategory === 'Alt Kategori Seçin' && { color: '#94A3B8' }]} numberOfLines={1}>
                {selectedSubcategory}
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
                  <TouchableOpacity onPress={() => handleSelectPlace(pref)} style={styles.removeChip}>
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

          {isSearching ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={{ color: '#94A3B8', marginTop: 12 }}>Aranıyor...</Text>
            </View>
          ) : searchResults.length === 0 && searchQuery.length > 2 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', marginBottom: 12, textAlign: 'center' }}>
                Aradığınız "{searchQuery}" mekanını bulamadık.
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#7B2CBF' }}
                onPress={openCustomPlaceModal}
              >
                <Text style={{ color: '#7B2CBF', fontWeight: '600' }}>+ Bu Mekanı Kendin Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : searchResults.length === 0 ? (
             <View style={{ padding: 20, alignItems: 'center' }}>
               <Text style={{ color: '#94A3B8' }}>Sonuç bulunamadı.</Text>
             </View>
          ) : (
            searchResults.map((place) => {
              const isSelected = selectedPrefs.find(p => p.id === place.id);
              return (
                <TouchableOpacity
                  key={place.id}
                  onPress={() => handleSelectPlace(place)}
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalItem} onPress={() => handleCitySelect(null, 'İl Seçin')}>
                <Text style={[styles.modalItemText, selectedCity === 'İl Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Tüm İller (Filtreyi Temizle)</Text>
              </TouchableOpacity>
              {cities.map((loc) => (
                <TouchableOpacity key={loc.id} style={styles.modalItem} onPress={() => handleCitySelect(loc.id, loc.name)}>
                  <Text style={[styles.modalItemText, selectedCity === loc.name && { color: '#7B2CBF', fontWeight: 'bold' }]}>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalItem} onPress={() => handleDistrictSelect(null, 'İlçe Seçin')}>
                <Text style={[styles.modalItemText, selectedDistrict === 'İlçe Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Tüm İlçeler (Filtreyi Temizle)</Text>
              </TouchableOpacity>
              {districts.map((district) => (
                <TouchableOpacity key={district.id} style={styles.modalItem} onPress={() => handleDistrictSelect(district.id, district.name)}>
                  <Text style={[styles.modalItemText, selectedDistrict === district.name && { color: '#7B2CBF', fontWeight: 'bold' }]}>{district.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MAHALLE SEÇİM MODALI */}
      <Modal visible={isNeighborhoodModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDistrict} - Mahalle Seçin</Text>
              <TouchableOpacity onPress={() => setNeighborhoodModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalItem} onPress={() => handleNeighborhoodSelect('Mahalle Seçin (Opsiyonel)')}>
                <Text style={[styles.modalItemText, selectedNeighborhood === 'Mahalle Seçin (Opsiyonel)' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Mahalle Filtresini Temizle</Text>
              </TouchableOpacity>
              {neighborhoods.map((neighborhood) => (
                <TouchableOpacity key={neighborhood.id} style={styles.modalItem} onPress={() => handleNeighborhoodSelect(neighborhood.name)}>
                  <Text style={[styles.modalItemText, selectedNeighborhood === neighborhood.name && { color: '#7B2CBF', fontWeight: 'bold' }]}>{neighborhood.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* KATEGORİ SEÇİM MODALI */}
      <Modal visible={isCategoryModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Seçin</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalItem} onPress={() => handleCategorySelect(null, 'Kategori Seçin')}>
                <Text style={[styles.modalItemText, selectedCategory === 'Kategori Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Tüm Kategoriler (Filtreyi Temizle)</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.modalItem} onPress={() => handleCategorySelect(cat.id, cat.name)}>
                  <Text style={[styles.modalItemText, selectedCategory === cat.name && { color: '#7B2CBF', fontWeight: 'bold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ALT KATEGORİ SEÇİM MODALI */}
      <Modal visible={isSubcategoryModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory} - Alt Kategori</Text>
              <TouchableOpacity onPress={() => setSubcategoryModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalItem} onPress={() => handleSubcategorySelect(null, 'Alt Kategori Seçin')}>
                <Text style={[styles.modalItemText, selectedSubcategory === 'Alt Kategori Seçin' && { color: '#7B2CBF', fontWeight: 'bold' }]}>Alt Kategori Filtresini Temizle</Text>
              </TouchableOpacity>
              {subcategories.map((subcat) => (
                <TouchableOpacity key={subcat.id} style={styles.modalItem} onPress={() => handleSubcategorySelect(subcat.id, subcat.name)}>
                  <Text style={[styles.modalItemText, selectedSubcategory === subcat.name && { color: '#7B2CBF', fontWeight: 'bold' }]}>{subcat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ÖZEL MEKAN EKLEME MODALI */}
      <Modal visible={isCustomPlaceModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', justifyContent: 'flex-end' }}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Mekan Ekle</Text>
                <TouchableOpacity onPress={() => setCustomPlaceModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Mekan/Kişi Adı</Text>
                <TextInput 
                  style={styles.customInput} 
                  value={customPlaceName} 
                  onChangeText={setCustomPlaceName} 
                  placeholder="Örn: Trilye Restoran" 
                />
                
                <Text style={styles.inputLabel}>Kategori</Text>
                <TextInput 
                  style={styles.customInput} 
                  value={customPlaceCategory} 
                  onChangeText={setCustomPlaceCategory} 
                  placeholder="Örn: Kafe, Restoran, Doktor..." 
                />
                
                <Text style={styles.inputLabel}>İl</Text>
                <TextInput 
                  style={styles.customInput} 
                  value={customPlaceCity} 
                  onChangeText={setCustomPlaceCity} 
                  placeholder="Örn: Ankara" 
                />
                
                <Text style={styles.inputLabel}>İlçe</Text>
                <TextInput 
                  style={styles.customInput} 
                  value={customPlaceDistrict} 
                  onChangeText={setCustomPlaceDistrict} 
                  placeholder="Örn: Çankaya" 
                />

                <Text style={styles.inputLabel}>Mahalle (Opsiyonel)</Text>
                <TextInput 
                  style={styles.customInput} 
                  value={customPlaceNeighborhood} 
                  onChangeText={setCustomPlaceNeighborhood} 
                  placeholder="Örn: Bahçelievler Mah." 
                />
                
                <TouchableOpacity style={[styles.continueBtn, styles.continueBtnActive, { marginTop: 24, marginBottom: 20 }]} onPress={handleAddCustomPlace}>
                  <Text style={styles.continueBtnText}>Mekanı Ekle ve Seç</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* DEĞERLENDİRME VE GİZLİLİK MODALI */}
      <Modal visible={isReviewModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', justifyContent: 'flex-end' }}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mekanı Değerlendir</Text>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)}><X size={24} color="#1E293B" /></TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16, textAlign: 'center' }}>
                  {currentPlaceToReview?.name}
                </Text>

                <Text style={styles.inputLabel}>Puanınız (1-5)</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                      <Star size={36} color={reviewRating >= star ? '#F59E0B' : '#E2E8F0'} fill={reviewRating >= star ? '#F59E0B' : 'transparent'} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Yorumunuz / Neden Güveniyorsunuz?</Text>
                <TextInput 
                  style={[styles.customInput, { height: 100, textAlignVertical: 'top' }]} 
                  value={reviewText} 
                  onChangeText={setReviewText} 
                  placeholder="Mekanla ilgili deneyiminiz veya tavsiye nedeniniz..." 
                  multiline
                />

                <Text style={styles.inputLabel}>Kimler Görebilir?</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  <TouchableOpacity 
                    style={[styles.visibilityBtn, reviewVisibility === 'public' && styles.visibilityBtnActive]}
                    onPress={() => setReviewVisibility('public')}
                  >
                    <Text style={[styles.visibilityBtnText, reviewVisibility === 'public' && styles.visibilityBtnTextActive]}>Herkese Açık</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.visibilityBtn, reviewVisibility === 'network' && styles.visibilityBtnActive]}
                    onPress={() => setReviewVisibility('network')}
                  >
                    <Text style={[styles.visibilityBtnText, reviewVisibility === 'network' && styles.visibilityBtnTextActive]}>Tüm Çevrem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.visibilityBtn, reviewVisibility === 'custom' && styles.visibilityBtnActive]}
                    onPress={() => setReviewVisibility('custom')}
                  >
                    <Text style={[styles.visibilityBtnText, reviewVisibility === 'custom' && styles.visibilityBtnTextActive]}>Yakın Çevrem</Text>
                  </TouchableOpacity>
                </View>

                {reviewVisibility === 'custom' && (
                  <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                    Not: Şu an "Yakın Çevrem" seçildiğinde sadece karşılıklı güvendiğiniz kişiler görebilir. (Kişi seçme arayüzü eklenecektir).
                  </Text>
                )}
                
                <TouchableOpacity style={[styles.continueBtn, styles.continueBtnActive, { marginTop: 10, marginBottom: 20 }]} onPress={handleSaveReview}>
                  <Text style={styles.continueBtnText}>Değerlendirmeyi Kaydet</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 6, marginTop: 12 },
  customInput: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  locationFilters: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  categoryFilters: { flexDirection: 'row', gap: 12, marginBottom: 12 },
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
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 16, color: '#1E293B' },
  visibilityBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, alignItems: 'center' },
  visibilityBtnActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  visibilityBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  visibilityBtnTextActive: { color: '#FFFFFF' },
});
