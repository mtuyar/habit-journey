import React, { useState, startTransition } from "react";
import { ScrollView, Switch, Alert, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack, useTheme } from "tamagui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useProgressStore } from "@/store/useProgressStore";
import { useTranslation } from "@/lib/i18n";
import { generateTestGoals } from "@/lib/testData";

const FONT_OPTIONS = [
  { label: "A-", value: 0.9 },
  { label: "A", value: 1.0 },
  { label: "A+", value: 1.15 },
  { label: "A++", value: 1.3 },
];

function SectionLabel({ children }: { children: string }) {
  const language = useSettingsStore((s) => s.language);
  const localized = children.toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US");
  return (
    <Text
      fontSize={11}
      fontWeight="700"
      color="$textMuted"
      letterSpacing={2}
      marginBottom={12}
      marginLeft={8}
    >
      {localized}
    </Text>
  );
}

function AlertActionCard({
  icon,
  title,
  desc,
  tone,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  desc: string;
  tone: "danger" | "success";
  onPress: () => void;
}) {
  const theme = useTheme();
  const toneHex =
    tone === "danger"
      ? theme.danger?.val ?? "#EF4444"
      : theme.success?.val ?? "#059669";
  const toneToken = tone === "danger" ? "$danger" : "$success";

  return (
    <Card interactive flexDirection="row" alignItems="center" onPress={onPress}>
      <YStack
        width={40}
        height={40}
        backgroundColor="$surfaceAlt"
        alignItems="center"
        justifyContent="center"
        borderRadius={20}
        marginRight={16}
      >
        <Ionicons name={icon} size={20} color={toneHex} />
      </YStack>
      <YStack flex={1}>
        <Text color={toneToken as any} fontWeight="700" fontSize={15}>
          {title}
        </Text>
        <Text fontSize={12} color={toneToken as any} marginTop={4} lineHeight={16}>
          {desc}
        </Text>
      </YStack>
    </Card>
  );
}

function Row({
  icon,
  label,
  children,
  borderBottom = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  children: React.ReactNode;
  borderBottom?: boolean;
}) {
  const theme = useTheme();
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      padding={20}
      borderBottomWidth={borderBottom ? 1 : 0}
      borderBottomColor="$border"
    >
      <XStack alignItems="center" flex={1}>
        <Ionicons name={icon} size={20} color={theme.textMuted?.val ?? "#64748B"} />
        <Text fontSize={15} fontWeight="500" marginLeft={12}>
          {label}
        </Text>
      </XStack>
      {children}
    </XStack>
  );
}

export default function SettingsScreen() {
  const {
    fontScale,
    setFontScale,
    isNotificationsEnabled,
    setNotificationsEnabled,
    notificationTime,
    setNotificationTime,
    language,
    setLanguage,
    isDarkMode,
    setDarkMode,
    geminiApiKey,
    setGeminiApiKey,
  } = useSettingsStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dateObj = new Date();
  dateObj.setHours(notificationTime.hour, notificationTime.minute, 0);

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedDate) {
      setNotificationTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
  };

  const handleResetData = () => {
    Alert.alert(t("resetAlertTitle"), t("resetAlertDesc"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("resetAll"),
        style: "destructive",
        onPress: () => {
          useProgressStore.setState({ goals: [] });
          Alert.alert(t("success"), t("resetSuccessMsg"));
        },
      },
    ]);
  };

  const muted = theme.textMuted?.val ?? "#64748B";
  const subtle = theme.textSubtle?.val ?? "#94A3B8";
  const accent = theme.accent?.val ?? "#0D9488";
  const bg = theme.bg?.val ?? "#F8FAFC";
  const textColor = theme.text?.val ?? "#0F172A";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <YStack
        paddingHorizontal={24}
        paddingTop={20}
        paddingBottom={12}
        borderBottomWidth={1}
        borderBottomColor="$border"
      >
        <Text fontSize={26} fontWeight="700" letterSpacing={-0.5}>
          {t("settings")}
        </Text>
      </YStack>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 110 }}>
        <YStack marginBottom={32}>
          <SectionLabel>{t("appearanceTitle")}</SectionLabel>
          <Card>
            <Text fontSize={15} fontWeight="500" marginBottom={16}>
              {t("appFontSize")}
            </Text>
            <XStack gap={8}>
              {FONT_OPTIONS.map((opt) => {
                const isActive = fontScale === opt.value;
                return (
                  <YStack
                    key={opt.label}
                    flex={1}
                    alignItems="center"
                    justifyContent="center"
                    paddingVertical={12}
                    borderRadius={12}
                    borderWidth={1}
                    backgroundColor={isActive ? "$accentSoft" : "$surfaceAlt"}
                    borderColor={isActive ? "$accent" : "$border"}
                    onPress={() => setFontScale(opt.value)}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <Text
                      fontWeight="600"
                      color={isActive ? "$accent" : "$textMuted"}
                    >
                      {opt.label}
                    </Text>
                  </YStack>
                );
              })}
            </XStack>
            <Text fontSize={12} color="$textMuted" marginTop={16} lineHeight={16}>
              {t("fontSizeDesc")}
            </Text>
          </Card>
        </YStack>

        <YStack marginBottom={32}>
          <SectionLabel>{t("preferences")}</SectionLabel>
          <Card flush>
            <Row icon="language-outline" label={t("appLanguage")} borderBottom>
              <XStack backgroundColor="$surfaceAlt" padding={4} borderRadius={12} gap={2}>
                {(["tr", "en"] as const).map((lng) => (
                  <YStack
                    key={lng}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={8}
                    backgroundColor={language === lng ? "$surface" : "transparent"}
                    onPress={() => startTransition(() => setLanguage(lng))}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <Text
                      fontSize={13}
                      fontWeight="600"
                      color={language === lng ? "$text" : "$textMuted"}
                    >
                      {lng === "tr" ? "TR" : "EN"}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            </Row>

            <Row icon="notifications-outline" label={t("dailyReminders")} borderBottom={isNotificationsEnabled}>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.borderStrong?.val ?? "#CBD5E1", true: accent }}
                thumbColor="#FFFFFF"
              />
            </Row>

            {isNotificationsEnabled && (
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding={20}
                backgroundColor="$surfaceAlt"
                borderBottomWidth={1}
                borderBottomColor="$border"
                onPress={() => setShowTimePicker(true)}
                pressStyle={{ opacity: 0.7 }}
              >
                <XStack alignItems="center">
                  <Ionicons name="time-outline" size={20} color={muted} />
                  <Text fontSize={15} fontWeight="500" marginLeft={12}>
                    {t("reminderTime")}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap={4}>
                  <Text color="$accent" fontWeight="700" fontSize={16}>
                    {notificationTime.hour.toString().padStart(2, "0")}:
                    {notificationTime.minute.toString().padStart(2, "0")}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={accent} />
                </XStack>
              </XStack>
            )}

            <Row icon="moon-outline" label={t("darkMode")}>
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: theme.borderStrong?.val ?? "#CBD5E1", true: accent }}
                thumbColor="#FFFFFF"
              />
            </Row>
          </Card>
        </YStack>

        <YStack marginBottom={24}>
          <SectionLabel>{t("aiSettingsTitle")}</SectionLabel>
          <Card>
            <XStack alignItems="center" marginBottom={16}>
              <Ionicons name="sparkles-outline" size={20} color={accent} />
              <Text fontSize={13} fontWeight="500" marginLeft={12}>
                {t("aiApiKeyLabel")}
              </Text>
            </XStack>

            <YStack
              backgroundColor="$surfaceAlt"
              borderColor="$border"
              borderWidth={1}
              borderRadius={12}
              overflow="hidden"
              marginBottom={8}
            >
              <TextInput
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                placeholder={t("aiApiKeyPlaceholder")}
                placeholderTextColor={subtle}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 14,
                  minHeight: 48,
                  color: textColor,
                }}
              />
            </YStack>

            <Text fontSize={11} color="$textMuted" lineHeight={16}>
              {t("aiApiKeyHelp")}
            </Text>
          </Card>
        </YStack>

        <YStack marginBottom={32}>
          <SectionLabel>{t("dangerZone")}</SectionLabel>
          <AlertActionCard
            icon="warning-outline"
            title={t("resetProgress")}
            desc={t("resetDesc")}
            tone="danger"
            onPress={handleResetData}
          />
        </YStack>

        {__DEV__ && (
          <YStack marginBottom={24}>
            <SectionLabel>{t("developerTitle")}</SectionLabel>
            <AlertActionCard
              icon="flask-outline"
              title={t("loadTestData")}
              desc={t("loadTestDataDesc")}
              tone="success"
              onPress={() => {
                Alert.alert(t("loadTestData"), t("loadTestDataConfirm"), [
                  { text: t("cancel"), style: "cancel" },
                  {
                    text: t("loadAction"),
                    onPress: () => {
                      const testGoals = generateTestGoals();
                      useProgressStore.setState((state) => ({
                        goals: [
                          ...state.goals.filter((g) => !g.id.startsWith("test-")),
                          ...testGoals,
                        ],
                      }));
                      Alert.alert(t("testDataLoadedTitle"), t("testDataLoadedDesc"));
                    },
                  },
                ]);
              }}
            />
          </YStack>
        )}

        <YStack alignItems="center" marginTop={16}>
          <Text fontSize={12} color="$textMuted" fontWeight="500">
            Alışkanlık Yolculuğum v1.0.0
          </Text>
          <Text fontSize={10} color="$textSubtle" marginTop={4}>
            {t("appFooterSubtitle")}
          </Text>
        </YStack>
      </ScrollView>

      {showTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={dateObj}
          mode="time"
          is24Hour
          display="default"
          onChange={onChangeTime}
        />
      )}
      {showTimePicker && Platform.OS === "ios" && (
        <YStack
          position="absolute"
          bottom={0}
          width="100%"
          backgroundColor="$surface"
          borderTopLeftRadius={32}
          borderTopRightRadius={32}
          overflow="hidden"
          paddingTop={8}
          paddingBottom={40}
          zIndex={50}
        >
          <XStack justifyContent="flex-end" paddingHorizontal={24} paddingTop={16} paddingBottom={8}>
            <YStack
              backgroundColor="$accentSoft"
              paddingHorizontal={20}
              paddingVertical={10}
              borderRadius={12}
              onPress={() => setShowTimePicker(false)}
              pressStyle={{ opacity: 0.7 }}
            >
              <Text color="$accent" fontWeight="700" fontSize={14}>
                {t("confirmTime")}
              </Text>
            </YStack>
          </XStack>
          <YStack alignItems="center" justifyContent="center" backgroundColor="$surface">
            <DateTimePicker
              value={dateObj}
              mode="time"
              is24Hour
              display="spinner"
              onChange={onChangeTime}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          </YStack>
        </YStack>
      )}
    </SafeAreaView>
  );
}
