import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        
        {/* Brand Icon or Logo Placeholder */}
        <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-8">
          <ShieldCheck size={48} color="#7B2CBF" />
        </View>

        {/* Title */}
        <Text className="text-4xl font-extrabold text-text-title text-center mb-4">
          Tavsi'ye Hoş Geldiniz
        </Text>

        {/* Subtitle / Tagline */}
        <Text className="text-lg text-text-body text-center leading-7 px-4">
          "Güvendiğiniz insanların gerçek hayat tercihlerini keşfedin."
        </Text>
      </View>

      {/* Bottom Action Area */}
      <View className="px-6 pb-12">
        <TouchableOpacity 
          className="bg-primary flex-row items-center justify-center py-4 rounded-2xl"
          onPress={() => navigation.navigate('HowItWorks')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold mr-2">Başlayalım</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
