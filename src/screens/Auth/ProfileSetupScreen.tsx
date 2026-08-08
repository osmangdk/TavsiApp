import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, User, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { colors } = useTheme();

  // Sosyal girişten (Google/Apple) aktarılan veriler
  const initialFirstName = route.params?.initialFirstName || '';
  const initialLastName = route.params?.initialLastName || '';
  const initialUsername = route.params?.initialUsername || '';
  const initialAvatarUrl: string | null = route.params?.initialAvatarUrl || null;
  const provider = route.params?.provider || null;

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [username, setUsername] = useState(initialUsername);
  // OAuth profil fotoğrafı varsa başlangıçta kullan
  const [avatarUri, setAvatarUri] = useState<string | null>(initialAvatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isComplete = firstName.trim().length > 1 && lastName.trim().length > 1 && username.trim().length > 2;

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

    setIsLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const userId = session?.user?.id || `temp_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        username: cleanedUsername,
        avatar_url: avatarUrl,
        setup_completed: true,
      });

      if (error && error.message && error.message.includes('profiles_username_key')) {
        setErrorMessage('Bu kullanıcı adı zaten alınmış, lütfen farklı bir tane deneyin.');
      } else {
        navigation.navigate('MandatoryPreferences');
      }
    } catch (err: any) {
      navigation.navigate('MandatoryPreferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    navigation.navigate('AuthOptions');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.cardBg }]} onPress={handleLogout}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Profilinizi Oluşturun</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Ağınızdaki kişilerin sizi tanıyabilmesi için bilgilerinizi girin.
          </Text>

          {/* Sosyal Giriş Aktarım Bilgisi */}
          {provider && (
            <View style={[styles.providerBanner, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}>
              <CheckCircle2 size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.providerBannerText, { color: colors.primary }]}>
                {provider === 'google' ? 'Google' : 'Apple'} hesabınızdan verileriniz başarıyla aktarıldı.
              </Text>
            </View>
          )}

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={[styles.avatarWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={handlePickImage}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <User size={40} color={colors.subText} />
              )}
              <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.subText }]}>Fotoğraf değiştirmek için tıklayın</Text>
          </View>

          {/* Alanlar */}
          <View style={styles.inputs}>
            <Text style={[styles.label, { color: colors.text }]}>Adınız</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
              placeholder="Örn: Ahmet"
              placeholderTextColor={colors.subText}
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Soyadınız</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
              placeholder="Örn: Yılmaz"
              placeholderTextColor={colors.subText}
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Kullanıcı Adı</Text>
            <View style={[styles.usernameWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.atSign, { color: colors.subText }]}>@</Text>
              <TextInput
                style={[styles.usernameInput, { color: colors.text }]}
                placeholder="ahmetyilmaz"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              isComplete ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(123, 44, 191, 0.4)' },
            ]}
            onPress={handleSaveProfile}
            activeOpacity={0.85}
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
  container: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 44 : 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 24, lineHeight: 22 },

  providerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  providerBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: { width: 104, height: 104, borderRadius: 52 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: { marginTop: 10, fontSize: 13 },

  inputs: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
  },
  usernameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  atSign: { fontSize: 18, fontWeight: '700', marginRight: 4 },
  usernameInput: { flex: 1, fontSize: 16 },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  saveBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    gap: 8,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
