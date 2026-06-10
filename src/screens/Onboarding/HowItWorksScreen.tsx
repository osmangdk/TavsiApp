import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Users, MapPin, Search, ArrowRight } from 'lucide-react-native';

export default function HowItWorksScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-extrabold text-text-title mb-10 text-center">
          Tavsi Nasıl Çalışır?
        </Text>

        <View className="flex-1 justify-center space-y-10">
          
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mr-4">
              <Users size={32} color="#7B2CBF" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-text-title mb-1">1. Çevrenizi Bulun</Text>
              <Text className="text-text-body leading-5">Gerçekten güvendiğiniz arkadaşlarınızı ve bağlantılarınızı ekleyin.</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mr-4">
              <MapPin size={32} color="#7B2CBF" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-text-title mb-1">2. Tercihleri Görün</Text>
              <Text className="text-text-body leading-5">Kliniklerden restoranlara kadar ağınızın nereye gittiğini keşfedin.</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mr-4">
              <Search size={32} color="#7B2CBF" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-text-title mb-1">3. Güvenle Keşfedin</Text>
              <Text className="text-text-body leading-5">Geleneksel puanlamalara değil, tanıdıklarınızın gerçek seçimlerine güvenin.</Text>
            </View>
          </View>

        </View>
      </View>

      <View className="px-6 pb-12">
        <TouchableOpacity 
          className="bg-primary flex-row items-center justify-center py-4 rounded-2xl"
          onPress={() => navigation.navigate('Privacy')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold mr-2">Devam Et</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
