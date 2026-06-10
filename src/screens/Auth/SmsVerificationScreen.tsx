import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, MessageSquareCode } from 'lucide-react-native';

export default function SmsVerificationScreen() {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto focus next input
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const isComplete = code.every(digit => digit !== '');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6 pt-12"
      >
        <View className="mb-10 items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-6">
            <MessageSquareCode size={32} color="#7B2CBF" />
          </View>
          <Text className="text-3xl font-extrabold text-text-title mb-3 text-center">Doğrulama Kodu</Text>
          <Text className="text-base text-text-body text-center px-4">
            Telefonunuza gönderdiğimiz 4 haneli doğrulama kodunu aşağıya girin.
          </Text>
        </View>

        <View className="flex-row justify-center space-x-4 mb-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => inputs.current[index] = el}
              className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl font-bold text-text-title"
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <TouchableOpacity className="items-center mb-8">
          <Text className="text-primary font-bold text-base">Kodu Tekrar Gönder (0:59)</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        <View className="pb-8">
          <TouchableOpacity 
            className={`flex-row items-center justify-center py-4 rounded-2xl ${isComplete ? 'bg-primary' : 'bg-primary/50'}`}
            onPress={() => isComplete && navigation.navigate('ProfileSetup')}
            activeOpacity={0.8}
            disabled={!isComplete}
          >
            <Text className="text-white text-lg font-bold mr-2">Doğrula</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
