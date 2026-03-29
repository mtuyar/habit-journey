import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useSettingsStore, AppLanguage } from '@/store/useSettingsStore';

const STEPS = ['language', 'apikey'] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('language');
  const { language, setLanguage, geminiApiKey, setGeminiApiKey, completeOnboarding } = useSettingsStore();

  const isEN = language === 'en';

  const copy = {
    welcomeTitle: isEN ? 'Welcome' : 'Hoş Geldin',
    welcomeSub: isEN
      ? 'Choose your language to get started.'
      : 'Başlamak için dilini seç.',
    langTitle: isEN ? 'Select Language' : 'Dil Seç',
    nextBtn: isEN ? 'Continue' : 'Devam Et',

    apiTitle: isEN ? 'AI Planning (Optional)' : 'Yapay Zeka (İsteğe Bağlı)',
    apiSub: isEN
      ? 'Enter a free Gemini API key to let AI build your journey roadmap in seconds. You can skip this and add it later in Settings.'
      : 'Ücretsiz Gemini API anahtarı girerek yapay zekanın saniyeler içinde yol haritanı çizmesini sağla. Şimdi geçebilir, daha sonra Ayarlar\'dan ekleyebilirsin.',
    apiKeyPlaceholder: isEN ? 'Paste Gemini API key here...' : 'Gemini API anahtarını buraya yapıştır...',
    apiHelp: isEN
      ? 'Get your free key at Google AI Studio'
      : 'Ücretsiz anahtarını Google AI Studio\'dan alabilirsin',
    skipBtn: isEN ? 'Skip for now' : 'Şimdi geç',
    startBtn: isEN ? 'Start Journey' : 'Yolculuğu Başlat',
  };

  function handleStart() {
    completeOnboarding();
    router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-journeyBg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 pt-16 pb-12 justify-between min-h-full">

            {/* Top — Logo / Icon */}
            <Animated.View entering={FadeInDown.springify()} className="items-center mb-12">
              <View className="w-20 h-20 rounded-[28px] bg-journeyAccent items-center justify-center mb-5">
                <Ionicons name="leaf" size={38} color="#FFF" />
              </View>
              <Text className="text-journeyText text-[30px] font-bold tracking-tight text-center">
                {copy.welcomeTitle}
              </Text>
              <Text className="text-journeyMuted text-[15px] text-center mt-2 leading-snug">
                {copy.welcomeSub}
              </Text>
            </Animated.View>

            {/* Step Content */}
            <View className="flex-1">
              {step === 'language' && (
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <Text className="text-journeyMuted text-[11px] font-bold uppercase tracking-[2px] mb-4 ml-1">
                    {copy.langTitle}
                  </Text>

                  <View className="flex-row gap-4">
                    <LanguageOption
                      flag="🇹🇷"
                      label="Türkçe"
                      selected={language === 'tr'}
                      onPress={() => setLanguage('tr')}
                    />
                    <LanguageOption
                      flag="🇬🇧"
                      label="English"
                      selected={language === 'en'}
                      onPress={() => setLanguage('en')}
                    />
                  </View>
                </Animated.View>
              )}

              {step === 'apikey' && (
                <Animated.View entering={SlideInRight.springify()}>
                  <Text className="text-journeyText text-[22px] font-bold mb-3">
                    {copy.apiTitle}
                  </Text>
                  <Text className="text-journeyMuted text-[14px] leading-relaxed mb-6">
                    {copy.apiSub}
                  </Text>

                  <View className="bg-journeyCard border border-journeyBorder rounded-[20px] overflow-hidden mb-3">
                    <TextInput
                      value={geminiApiKey}
                      onChangeText={setGeminiApiKey}
                      placeholder={copy.apiKeyPlaceholder}
                      placeholderTextColor="#5F8B8A"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="px-5 py-4 text-[14px] text-journeyText"
                      style={{ minHeight: 52 }}
                    />
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="sparkles-outline" size={13} color="#0D9488" />
                    <Text className="text-journeyAccent text-[12px] ml-1.5 leading-snug">
                      {copy.apiHelp}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Bottom Buttons */}
            <Animated.View entering={FadeInUp.delay(300).springify()} className="mt-10 gap-3">
              {step === 'language' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setStep('apikey')}
                  className="bg-journeyAccent py-4 rounded-[24px] items-center"
                >
                  <Text className="text-white font-bold text-[16px] tracking-wide">
                    {copy.nextBtn}
                  </Text>
                </TouchableOpacity>
              )}

              {step === 'apikey' && (
                <>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleStart}
                    className="bg-journeyAccent py-4 rounded-[24px] items-center"
                  >
                    <Text className="text-white font-bold text-[16px] tracking-wide">
                      {copy.startBtn}
                    </Text>
                  </TouchableOpacity>

                  {!geminiApiKey && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleStart}
                      className="py-3 items-center"
                    >
                      <Text className="text-journeyMuted text-[14px]">{copy.skipBtn}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setStep('language')}
                    className="py-2 items-center flex-row justify-center gap-1"
                  >
                    <Ionicons name="chevron-back" size={14} color="#5F8B8A" />
                    <Text className="text-journeyMuted text-[13px]">
                      {isEN ? 'Back' : 'Geri'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step dots */}
              <View className="flex-row justify-center gap-2 mt-1">
                {STEPS.map(s => (
                  <View
                    key={s}
                    className="h-1.5 rounded-full"
                    style={{
                      width: step === s ? 20 : 6,
                      backgroundColor: step === s ? '#0D9488' : '#B2F0E8',
                    }}
                  />
                ))}
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LanguageOption({
  flag,
  label,
  selected,
  onPress,
}: {
  flag: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1"
    >
      <View
        className="rounded-[24px] py-6 items-center border-2"
        style={{
          borderColor: selected ? '#0D9488' : '#B2F0E8',
          backgroundColor: selected ? '#0D948818' : '#FFFFFF',
        }}
      >
        <Text style={{ fontSize: 36, marginBottom: 8 }}>{flag}</Text>
        <Text
          className="font-semibold text-[15px]"
          style={{ color: selected ? '#0D9488' : '#134E4A' }}
        >
          {label}
        </Text>
        {selected && (
          <View className="absolute top-3 right-3 w-5 h-5 rounded-full bg-journeyAccent items-center justify-center">
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
