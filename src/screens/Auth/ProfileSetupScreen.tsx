import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, User, ArrowRight } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isComplete = firstName.length > 1 && lastName.length > 1 && username.length > 2;

  const handleSaveProfile = async () => {
    if (!isComplete || !session?.user?.id) return;
    
    setIsLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    // Veritabanını güncelle
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username.trim().toLowerCase(),
      })
      .eq('id', session.user.id);
      
    setIsLoading(false);
    
    if (error) {
      Alert.alert('Hata', 'Profil kaydedilirken bir sorun oluştu: ' + error.message);
    } else {
      navigation.navigate('MandatoryPreferences');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-12" showsVerticalScrollIndicator={false}>
          <Text className="text-3xl font-extrabold text-text-title mb-2">Profilinizi Oluşturun</Text>
          <Text className="text-base text-text-body mb-10">
            Ağınızdaki kişilerin sizi tanıyabilmesi için bilgilerinizi girin.
          </Text>

          {/* Profile Photo Placeholder */}
          <View className="items-center mb-10">
            <TouchableOpacity className="w-28 h-28 bg-gray-100 rounded-full items-center justify-center border-2 border-dashed border-gray-300 relative">
              <User size={40} color="#94A3B8" />
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
