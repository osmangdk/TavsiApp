import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, User, Check, MapPin } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { profileData } = route.params || {};

  const [fullName, setFullName] = useState(profileData?.full_name || '');
  const [username, setUsername] = useState(profileData?.username || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [city, setCity] = useState(profileData?.city || '');
  const [district, setDistrict] = useState(profileData?.district || '');
  const [isLoading, setIsLoading] = useState(!profileData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
      setCity(profileData.city || '');
      setDistrict(profileData.district || '');
    }
    fetchProfile();
  }, [session, profileData]);

  const fetchProfile = async () => {
    const targetUserId = profileData?.id || session?.user?.id;
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, bio, city, district')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Profil yükleme hatası:', error.message);
      } else if (data) {
        if (data.full_name) setFullName(data.full_name);
        if (data.username) setUsername(data.username);
        if (data.bio !== undefined && data.bio !== null) setBio(data.bio);
        if (data.city) setCity(data.city);
        if (data.district) setDistrict(data.district);
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const targetUserId = profileData?.id || session?.user?.id;
    if (!targetUserId) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ad soyad alanını doldurun.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanedUsername.length < 3) {
        Alert.alert('Hata', 'Kullanıcı adı en az 3 harf, rakam veya alt çizgi içermelidir.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: cleanedUsername,
          bio: bio.trim(),
          city: city.trim() || null,
          district: district.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) {
        Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu: ' + error.message);
      } else {
        if (Platform.OS === 'web') {
          window.alert('Profiliniz başarıyla güncellendi!');
        } else {
          Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
        }
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      Alert.alert('Hata', error?.message || 'Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#7B2CBF" /> : <Check size={24} color="#7B2CBF" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar Mock */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName ? fullName.substring(0, 2).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Fotoğraf profilinizde otomatik gösterilir</Text>
        </View>

        {/* Form Alanları */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ad Soyad"
            placeholderTextColor="#94A3B8"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="kullanici_adi"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        {/* İl & İlçe Alanları */}
        <View style={styles.rowFormGroup}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>İl</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Örn: Ankara"
              placeholderTextColor="#94A3B8"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>İlçe</Text>
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder="Örn: Çankaya"
              placeholderTextColor="#94A3B8"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Biyografi / Hakkımda</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tavsi ağındakiler için kendinizden bahsedin..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSave} 
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'android' ? 14 : 10, 
    paddingBottom: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  saveHeaderBtn: { padding: 8 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  avatarHint: { fontSize: 13, color: '#94A3B8' },
  formGroup: { marginBottom: 18 },
  rowFormGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#7B2CBF', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
