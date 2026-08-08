import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, User, Check } from 'lucide-react-native';
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
  const [isLoading, setIsLoading] = useState(!profileData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
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
        .select('full_name, username, bio')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Profil yükleme hatası:', error.message);
      } else if (data) {
        if (data.full_name) setFullName(data.full_name);
        if (data.username) setUsername(data.username);
        if (data.bio !== undefined && data.bio !== null) setBio(data.bio);
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) {
        Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu: ' + error.message);
      } else {
        if (Platform.OS === 'web') {
          window.alert('Profiliniz başarıyla güncellendi!');
        } else {
          Alert.alert('Başarılı', 'Profiliniz başarıyla güncellendi.');
        }
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Güncelleme sırasında bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </SafeAreaView>
    );
  }

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Mock */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarMock}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
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
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Biyografi / Hakkımda</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tavsi ağındakiler için kendinizden bahsedin..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={4}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { padding: 8, marginLeft: -8 },
  saveHeaderBtn: { padding: 8, marginRight: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 20 },

  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarMock: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },

  submitBtn: { backgroundColor: '#7B2CBF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
