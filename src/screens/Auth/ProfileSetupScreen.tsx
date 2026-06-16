import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isComplete = firstName.length > 1 && lastName.length > 1 && username.length > 2;

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
      // Veritabanını güncelle
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          username: cleanedUsername,
        });
        
      if (error) {
        console.error("Supabase Save Error:", error);
        setErrorMessage(error.message || 'Profil kaydedilirken bir hata oluştu.');
      } else {
        navigation.navigate('MandatoryPreferences');
      }
    } catch (err: any) {
      console.error("Catch Error:", err);
      setErrorMessage(err?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (firstName.trim().length > 0 || lastName.trim().length > 0) {
      const nameParam = encodeURIComponent(`${firstName.trim()} ${lastName.trim()}`.trim());
      // ui-avatars.com bazen Vercel CSP tarafından engellenebilir, dicebear kullanalım.
      return `https://api.dicebear.com/7.x/initials/png?seed=${nameParam}&backgroundColor=7b2cbf&textColor=ffffff`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mb-6"
            onPress={handleLogout}
          >
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>

          <Text className="text-3xl font-extrabold text-text-title mb-2">Profilinizi Oluşturun</Text>
          <Text className="text-base text-text-body mb-10">
            Ağınızdaki kişilerin sizi tanıyabilmesi için bilgilerinizi girin.
          </Text>

          {/* Profile Photo Placeholder */}
          <View className="items-center mb-10">
            <TouchableOpacity className={`w-28 h-28 rounded-full items-center justify-center relative overflow-hidden ${!avatarUrl ? 'bg-gray-100 border-2 border-dashed border-gray-300' : 'bg-primary'}`}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 112, height: 112, borderRadius: 56 }} 
                  resizeMode="cover"
                />
              ) : (
                <User size={40} color="#94A3B8" />
              )}
              <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                <Camera size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-bold text-text-title mb-2 ml-1">Adınız</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-lg text-text-title"
                placeholder="Örn: Ahmet"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-text-title mb-2 ml-1">Soyadınız</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-lg text-text-title"
                placeholder="Örn: Yılmaz"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-text-title mb-2 ml-1">Kullanıcı Adı</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
                <Text className="text-lg text-gray-400 font-bold mr-1">@</Text>
                <TextInput
                  className="flex-1 py-4 text-lg text-text-title lowercase"
                  placeholder="ahmetyilmaz"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>
          </View>
          
          <View className="h-20" />
        </ScrollView>

        <View className="px-6 pb-8 pt-4 bg-background border-t border-gray-100">
          {errorMessage ? (
            <Text className="text-red-500 text-center mb-4 font-medium">{errorMessage}</Text>
          ) : null}
          <TouchableOpacity 
            className={`flex-row items-center justify-center py-4 rounded-2xl ${isComplete && !isLoading ? 'bg-primary' : 'bg-primary/50'}`}
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            disabled={!isComplete || isLoading}
          >
            <Text className="text-white text-lg font-bold mr-2">{isLoading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}</Text>
            {!isLoading && <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
