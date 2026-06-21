import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, User, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isComplete = firstName.length > 1 && lastName.length > 1 && username.length > 2;

  // Web'de file input ile fotoğraf seçimi
  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file || !session?.user?.id) return;

        const objectUrl = URL.createObjectURL(file);
        setAvatarUri(objectUrl);

        setIsLoading(true);
        try {
          const fileExt = file.name.split('.').pop();
          const filePath = `${session.user.id}/avatar.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = urlData?.publicUrl;
            if (publicUrl) {
              setAvatarUri(publicUrl);
              await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: publicUrl });
            }
          }
        } catch (err) {
          console.error('Fotoğraf yükleme hatası:', err);
        } finally {
          setIsLoading(false);
        }
      };
      input.click();
    }
  };

  const getAvatarUrl = () => {
    if (avatarUri) return avatarUri;
    if (firstName.trim().length > 0 || lastName.trim().length > 0) {
      const nameParam = encodeURIComponent(`${firstName.trim()} ${lastName.trim()}`.trim());
      return `https://api.dicebear.com/7.x/initials/png?seed=${nameParam}&backgroundColor=7b2cbf&textColor=ffffff`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const handleSaveProfile = async () => {
    setErrorMessage('');
    if (!isComplete) {
      setErrorMessage('Lütfen tüm alanları doldurun.');
      return;
    }
    if (!session?.user?.id) {
      setErrorMessage('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    setIsLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          username: cleanedUsername,
        });
        
      if (error) {
        if (error.message && error.message.includes('profiles_username_key')) {
          setErrorMessage('Bu kullanıcı adı zaten alınmış, lütfen farklı bir tane deneyin.');
        } else {
          setErrorMessage(error.message || 'Profil kaydedilirken bir hata oluştu.');
        }
      } else {
        navigation.navigate('MandatoryPreferences');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backBtn} onPress={handleLogout}>
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>

          <Text style={styles.title}>Profilinizi Oluşturun</Text>
          <Text style={styles.subtitle}>Ağınızdaki kişilerin sizi tanıyabilmesi için bilgilerinizi girin.</Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <User size={40} color="#94A3B8" />
              )}
              <View style={styles.cameraBtn}>
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Fotoğraf eklemek için tıklayın</Text>
          </View>

          {/* Alanlar */}
          <View style={styles.inputs}>
            <Text style={styles.label}>Adınız</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ahmet"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text style={styles.label}>Soyadınız</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Yılmaz"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={styles.label}>Kullanıcı Adı</Text>
            <View style={styles.usernameWrapper}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                placeholder="ahmetyilmaz"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>
          
          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={styles.footer}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <TouchableOpacity 
            style={[styles.saveBtn, (!isComplete || isLoading) && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            disabled={!isComplete || isLoading}
          >
            <Text style={styles.saveBtnText}>{isLoading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}</Text>
            {!isLoading && <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 36, lineHeight: 22 },

  avatarSection: { alignItems: 'center', marginBottom: 36 },
  avatarWrapper: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', position: 'relative', overflow: 'hidden', cursor: 'pointer' } as any,
  avatarImage: { width: 112, height: 112, borderRadius: 56 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#7B2CBF', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarHint: { marginTop: 10, fontSize: 13, color: '#94A3B8' },

  inputs: { gap: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1E293B' },
  usernameWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16 },
  atSign: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginRight: 4 },
  usernameInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B' },

  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7B2CBF', paddingVertical: 16, borderRadius: 20, gap: 8 },
  saveBtnDisabled: { backgroundColor: '#C4B5FD' },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
