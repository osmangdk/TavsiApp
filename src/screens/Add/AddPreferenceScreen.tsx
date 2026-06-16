import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { Search, MapPin, Coffee, Stethoscope, Scissors, Wrench, ChevronRight, Plus, Star, Globe, Users, Lock, X, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { id: '1', name: 'Restoran & Kafe', icon: Coffee, color: '#F59E0B' },
  { id: '2', name: 'Doktor & Sağlık', icon: Stethoscope, color: '#10B981' },
  { id: '3', name: 'Kişisel Bakım', icon: Scissors, color: '#EC4899' },
  { id: '4', name: 'Usta & Tamirat', icon: Wrench, color: '#3B82F6' },
];

export default function AddPreferenceScreen() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewVisibility, setReviewVisibility] = useState('network');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchFoursquare(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchFoursquare = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'Authorization': 'F5NUFOMY0XPN13SVB0SINGXGIHSMTVSCJ3US1BT5FZKZQ1GB',
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const formattedResults = data.results.map((place: any) => ({
          id: place.fsq_id,
          name: place.name,
          category: place.categories && place.categories.length > 0 ? place.categories[0].name : 'Mekan',
          city: place.location?.region || 'Bilinmiyor',
          district: place.location?.locality || 'Bilinmiyor',
          latitude: place.geocodes?.main?.latitude,
          longitude: place.geocodes?.main?.longitude,
        }));
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Foursquare API Hatası:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    setReviewRating(0);
    setReviewText('');
    setReviewVisibility('network');
    setReviewModalVisible(true);
  };

  const handleSaveReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Eksik Bilgi', 'Lütfen mekana 1 ile 5 arası bir yıldız verin.');
      return;
    }
    if (!session?.user?.id) return;
    
    setIsSaving(true);
    try {
      // 1. Mekanı kaydet (Eğer yoksa)
      await supabase
        .from('places')
        .upsert({
          osm_id: selectedPlace.id.toString(),
          name: selectedPlace.name,
          category: selectedPlace.category,
          city: selectedPlace.city,
          district: selectedPlace.district,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude
        }, { onConflict: 'osm_id' });

      // 2. Mekan ID'sini al
      const { data: placeData } = await supabase
        .from('places')
        .select('id')
        .eq('osm_id', selectedPlace.id.toString())
        .single();

      if (placeData) {
        // 3. User Place tablosuna ekle
        await supabase
          .from('user_places')
          .upsert({
            user_id: session.user.id,
            place_id: placeData.id,
            rating: reviewRating,
            review_text: reviewText,
            visibility: reviewVisibility
          }, { onConflict: 'user_id, place_id' });
          
        setSuccessMessage('Mekan başarıyla haritanıza eklendi!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      setReviewModalVisible(false);
      setSelectedPlace(null);
      setSearchQuery('');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Mekan kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tercih Ekle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {successMessage !== '' && (
          <View style={styles.successBanner}>
            <CheckCircle size={20} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

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
            {isSearching && <ActivityIndicator size="small" color="#7B2CBF" />}
          </View>
        </View>

        {/* Arama Sonuçları */}
        {searchQuery.length > 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arama Sonuçları</Text>
            {searchResults.length > 0 ? (
              searchResults.map((place, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.searchResultItem}
                  onPress={() => handleSelectPlace(place)}
                >
                  <View style={styles.resultIconWrapper}>
                    <MapPin size={20} color="#7B2CBF" />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultCategory}>{place.category} • {place.district}</Text>
                  </View>
                  <View style={styles.addButton}>
                    <Plus size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))
            ) : !isSearching ? (
              <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 10 }}>Sonuç bulunamadı.</Text>
            ) : null}
          </View>
        )}

        {searchQuery.length <= 2 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hızlı Kategori Seçimi</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <TouchableOpacity key={cat.id} style={styles.categoryCard} activeOpacity={0.7} onPress={() => setSearchQuery(cat.name)}>
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
              <Text style={styles.sectionTitle}>Yakın zamanda ziyaret ettikleriniz (Örnek)</Text>
              
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
            </View>
          </>
        )}

      </ScrollView>

      {/* Değerlendirme Modalı */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setReviewModalVisible(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPlace?.name}</Text>
              <Text style={styles.modalSubtitle}>{selectedPlace?.category}</Text>
            </View>

            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Mekana Puanınız</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Star 
                      size={36} 
                      color={star <= reviewRating ? "#F59E0B" : "#E2E8F0"} 
                      fill={star <= reviewRating ? "#F59E0B" : "transparent"} 
                      style={{ marginHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Neden Tavsiye Ediyorsunuz? (Opsiyonel)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Örn: Yemekleri harika, çalışanlar çok ilgili..."
                multiline
                numberOfLines={3}
                value={reviewText}
                onChangeText={setReviewText}
              />
            </View>

            <View style={styles.visibilityContainer}>
              <Text style={styles.inputLabel}>Kimler Görebilir?</Text>
              
              <TouchableOpacity 
                style={[styles.visibilityOption, reviewVisibility === 'public' && styles.visibilityOptionActive]}
                onPress={() => setReviewVisibility('public')}
              >
                <Globe size={20} color={reviewVisibility === 'public' ? '#7B2CBF' : '#64748B'} />
                <View style={styles.visibilityTextContainer}>
                  <Text style={[styles.visibilityTitle, reviewVisibility === 'public' && styles.visibilityTitleActive]}>Herkese Açık</Text>
                  <Text style={styles.visibilityDesc}>Uygulamadaki herkes görebilir</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.visibilityOption, reviewVisibility === 'network' && styles.visibilityOptionActive]}
                onPress={() => setReviewVisibility('network')}
              >
                <Users size={20} color={reviewVisibility === 'network' ? '#7B2CBF' : '#64748B'} />
                <View style={styles.visibilityTextContainer}>
                  <Text style={[styles.visibilityTitle, reviewVisibility === 'network' && styles.visibilityTitleActive]}>Tüm Çevrem</Text>
                  <Text style={styles.visibilityDesc}>1. ve 2. derece ağınız görebilir</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.visibilityOption, reviewVisibility === 'close_friends' && styles.visibilityOptionActive]}
                onPress={() => setReviewVisibility('close_friends')}
              >
                <Lock size={20} color={reviewVisibility === 'close_friends' ? '#7B2CBF' : '#64748B'} />
                <View style={styles.visibilityTextContainer}>
                  <Text style={[styles.visibilityTitle, reviewVisibility === 'close_friends' && styles.visibilityTitleActive]}>Sadece Yakın Çevrem</Text>
                  <Text style={styles.visibilityDesc}>Sadece 1. derece ağınız görebilir</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveReview}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Kaydediliyor...' : 'Tercihimi Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  successText: { color: '#065F46', fontWeight: '600' },

  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#7B2CBF', borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B', outlineStyle: 'none' },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8F9FA', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  resultIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  resultCategory: { fontSize: 13, color: '#64748B' },
  
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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  modalCloseBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 4 },
  modalHeader: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  ratingContainer: { alignItems: 'center', marginBottom: 24 },
  ratingLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center' },
  inputContainer: { marginBottom: 24 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  textArea: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 15, color: '#1E293B' },
  visibilityContainer: { marginBottom: 32 },
  visibilityOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#F1F5F9', marginBottom: 12 },
  visibilityOptionActive: { borderColor: '#7B2CBF', backgroundColor: 'rgba(123, 44, 191, 0.05)' },
  visibilityTextContainer: { marginLeft: 16, flex: 1 },
  visibilityTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  visibilityTitleActive: { color: '#7B2CBF' },
  visibilityDesc: { fontSize: 13, color: '#64748B' },
  saveBtn: { backgroundColor: '#7B2CBF', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
