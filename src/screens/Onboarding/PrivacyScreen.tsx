import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react-native';

export default function PrivacyScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-12">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-status-warning/10 rounded-full items-center justify-center mb-6">
            <ShieldAlert size={40} color="#F59E0B" />
          </View>
          <Text className="text-3xl font-extrabold text-text-title text-center">
            Önce Gizlilik
          </Text>
        </View>

        <Text className="text-lg text-text-body text-center leading-7 mb-10">
          Tavsi'de kontrol tamamen sizde. Her tercihiniz için görünürlüğü ayrı ayrı belirleyebilirsiniz.
        </Text>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <CheckCircle size={24} color="#10B981" />
            <Text className="text-base text-text-title ml-3 flex-1">Hangi doktorlara gittiğinizi sadece 'Ben' veya 'Arkadaşlar' olarak kısıtlayın.</Text>
          </View>
          
          <View className="flex-row items-center mb-4">
            <CheckCircle size={24} color="#10B981" />
            <Text className="text-base text-text-title ml-3 flex-1">Restoran favorilerinizi 'Ağa Açık' hale getirerek çevrenize ilham verin.</Text>
          </View>

          <View className="flex-row items-center">
            <CheckCircle size={24} color="#10B981" />
            <Text className="text-base text-text-title ml-3 flex-1">İsterseniz tercihlerinizi profil isminizi gizleyerek 'Anonim' paylaşın.</Text>
          </View>
        </View>

      </View>

      <View className="px-6 pb-12 pt-4">
        <TouchableOpacity 
          className="bg-text-title flex-row items-center justify-center py-4 rounded-2xl"
          onPress={() => navigation.navigate('AuthOptions')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold mr-2">Hesap Oluştur</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
