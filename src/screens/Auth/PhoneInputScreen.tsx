import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone, ArrowRight } from 'lucide-react-native';

export default function PhoneInputScreen() {
  const navigation = useNavigation<any>();
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6 pt-12"
      >
        <View className="mb-10">
          <Text className="text-3xl font-extrabold text-text-title mb-3">Telefon Numaranız</Text>
          <Text className="text-base text-text-body">
            Tavsi'ye katılmak ve ağınızı oluşturmak için telefon numaranızı girin. Size bir doğrulama kodu göndereceğiz.
          </Text>
        </View>

        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-8">
          <Phone size={24} color="#7B2CBF" />
          <Text className="text-lg text-text-title font-bold ml-3 mr-2">+90</Text>
          <View className="w-[1px] h-6 bg-gray-300 mr-3" />
          <TextInput
            className="flex-1 text-lg text-text-title font-medium"
            placeholder="5XX XXX XX XX"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            autoFocus
          />
        </View>

        <View className="flex-1" />

        <View className="pb-8">
          <TouchableOpacity 
            className={`flex-row items-center justify-center py-4 rounded-2xl ${phoneNumber.length >= 10 ? 'bg-primary' : 'bg-primary/50'}`}
            onPress={() => phoneNumber.length >= 10 && navigation.navigate('SmsVerification')}
            activeOpacity={0.8}
            disabled={phoneNumber.length < 10}
          >
            <Text className="text-white text-lg font-bold mr-2">Kodu Gönder</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
