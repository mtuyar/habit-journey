import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "@/lib/i18n";

const STEPS = ["language", "apikey"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>("language");
  const { language, setLanguage, geminiApiKey, setGeminiApiKey, completeOnboarding } =
    useSettingsStore();
  const theme = useTheme();
  const { upper } = useTranslation();

  const isEN = language === "en";

  const copy = {
    welcomeTitle: isEN ? "Welcome" : "Hoş Geldin",
    welcomeSub: isEN ? "Choose your language to get started." : "Başlamak için dilini seç.",
    langTitle: isEN ? "Select Language" : "Dil Seç",
    nextBtn: isEN ? "Continue" : "Devam Et",
    apiTitle: isEN ? "AI Planning (Optional)" : "Yapay Zeka (İsteğe Bağlı)",
    apiSub: isEN
      ? "Enter a free Gemini API key to let AI build your journey roadmap in seconds. You can skip this and add it later in Settings."
      : "Ücretsiz Gemini API anahtarı girerek yapay zekanın saniyeler içinde yol haritanı çizmesini sağla. Şimdi geçebilir, daha sonra Ayarlar'dan ekleyebilirsin.",
    apiKeyPlaceholder: isEN
      ? "Paste Gemini API key here..."
      : "Gemini API anahtarını buraya yapıştır...",
    apiHelp: isEN
      ? "Get your free key at Google AI Studio"
      : "Ücretsiz anahtarını Google AI Studio'dan alabilirsin",
    skipBtn: isEN ? "Skip for now" : "Şimdi geç",
    startBtn: isEN ? "Start Journey" : "Yolculuğu Başlat",
    backBtn: isEN ? "Back" : "Geri",
  };

  function handleStart() {
    completeOnboarding();
    router.replace("/");
  }

  const accent = theme.accent?.val ?? "#0D9488";
  const muted = theme.textMuted?.val ?? "#64748B";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg?.val ?? "#F8FAFC" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack
            flex={1}
            paddingHorizontal={32}
            paddingTop={64}
            paddingBottom={48}
            justifyContent="space-between"
            minHeight="100%"
          >
            <Animated.View entering={FadeInDown.springify()}>
              <YStack alignItems="center" marginBottom={48}>
                <YStack
                  width={80}
                  height={80}
                  borderRadius={28}
                  backgroundColor="$accent"
                  alignItems="center"
                  justifyContent="center"
                  marginBottom={20}
                >
                  <Ionicons name="leaf" size={38} color="#FFF" />
                </YStack>
                <Text fontSize={30} fontWeight="700" letterSpacing={-0.5} textAlign="center">
                  {copy.welcomeTitle}
                </Text>
                <Text
                  fontSize={15}
                  color="$textMuted"
                  textAlign="center"
                  marginTop={8}
                  lineHeight={20}
                >
                  {copy.welcomeSub}
                </Text>
              </YStack>
            </Animated.View>

            <YStack flex={1}>
              {step === "language" && (
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <Text
                    fontSize={11}
                    fontWeight="700"
                    color="$textMuted"
                    letterSpacing={2}
                    marginBottom={16}
                    marginLeft={4}
                  >
                    {upper(copy.langTitle)}
                  </Text>
                  <XStack gap={16}>
                    <LanguageOption
                      code="TR"
                      label="Türkçe"
                      selected={language === "tr"}
                      onPress={() => setLanguage("tr")}
                    />
                    <LanguageOption
                      code="EN"
                      label="English"
                      selected={language === "en"}
                      onPress={() => setLanguage("en")}
                    />
                  </XStack>
                </Animated.View>
              )}

              {step === "apikey" && (
                <Animated.View entering={SlideInRight.springify()}>
                  <Text fontSize={22} fontWeight="700" marginBottom={12}>
                    {copy.apiTitle}
                  </Text>
                  <Text fontSize={14} color="$textMuted" lineHeight={22} marginBottom={24}>
                    {copy.apiSub}
                  </Text>

                  <YStack
                    backgroundColor="$surface"
                    borderColor="$border"
                    borderWidth={1}
                    borderRadius={20}
                    overflow="hidden"
                    marginBottom={12}
                  >
                    <TextInput
                      value={geminiApiKey}
                      onChangeText={setGeminiApiKey}
                      placeholder={copy.apiKeyPlaceholder}
                      placeholderTextColor={muted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        fontSize: 14,
                        color: theme.text?.val ?? "#0F172A",
                        minHeight: 52,
                      }}
                    />
                  </YStack>

                  <XStack alignItems="center" gap={6}>
                    <Ionicons name="sparkles-outline" size={13} color={accent} />
                    <Text fontSize={12} color="$accent" lineHeight={16}>
                      {copy.apiHelp}
                    </Text>
                  </XStack>
                </Animated.View>
              )}
            </YStack>

            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <YStack marginTop={40} gap={12}>
                {step === "language" && (
                  <Button onPress={() => setStep("apikey")} fullWidth size="lg">
                    {copy.nextBtn}
                  </Button>
                )}

                {step === "apikey" && (
                  <>
                    <Button onPress={handleStart} fullWidth size="lg">
                      {copy.startBtn}
                    </Button>
                    {!geminiApiKey && (
                      <Button onPress={handleStart} variant="ghost" fullWidth>
                        {copy.skipBtn}
                      </Button>
                    )}
                    <XStack
                      alignItems="center"
                      justifyContent="center"
                      gap={4}
                      paddingVertical={8}
                      onPress={() => setStep("language")}
                      pressStyle={{ opacity: 0.7 }}
                    >
                      <Ionicons name="chevron-back" size={14} color={muted} />
                      <Text fontSize={13} color="$textMuted">
                        {copy.backBtn}
                      </Text>
                    </XStack>
                  </>
                )}

                <XStack justifyContent="center" gap={8} marginTop={4}>
                  {STEPS.map((s) => (
                    <YStack
                      key={s}
                      height={6}
                      width={step === s ? 20 : 6}
                      borderRadius={99}
                      backgroundColor={step === s ? accent : "$borderStrong"}
                    />
                  ))}
                </XStack>
              </YStack>
            </Animated.View>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LanguageOption({
  code,
  label,
  selected,
  onPress,
}: {
  code: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <YStack
      flex={1}
      borderRadius={20}
      paddingVertical={24}
      alignItems="center"
      borderWidth={2}
      borderColor={selected ? "$accent" : "$border"}
      backgroundColor={selected ? "$accentSoft" : "$surface"}
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
      cursor="pointer"
    >
      <Text
        fontSize={26}
        fontWeight="800"
        letterSpacing={1}
        marginBottom={6}
        color={selected ? "$accent" : "$textMuted"}
      >
        {code}
      </Text>
      <Text fontWeight="600" fontSize={15} color={selected ? "$accent" : "$text"}>
        {label}
      </Text>
      {selected && (
        <YStack
          position="absolute"
          top={12}
          right={12}
          width={20}
          height={20}
          borderRadius={10}
          backgroundColor="$accent"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="checkmark" size={12} color="#FFF" />
        </YStack>
      )}
    </YStack>
  );
}
