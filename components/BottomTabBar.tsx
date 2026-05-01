import React from "react";
import { Platform } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, useTheme } from "tamagui";
import { Text } from "@/components/ui/Text";
import { useTranslation } from "@/lib/i18n";

const TABS = [
  { path: "/", icon: "leaf-outline", activeIcon: "leaf", labelKey: "tabHome" },
  { path: "/insights", icon: "bar-chart-outline", activeIcon: "bar-chart", labelKey: "tabStats" },
  { path: "/settings", icon: "settings-outline", activeIcon: "settings", labelKey: "tabSettings" },
] as const;

const TAB_SCREENS = new Set(["/", "/insights", "/settings"]);

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  if (!TAB_SCREENS.has(pathname)) return null;

  const accent = theme.accent?.val ?? "#0D9488";
  const muted = theme.textMuted?.val ?? "#64748B";

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="$surface"
      alignItems="flex-end"
      paddingTop={10}
      paddingHorizontal={8}
      paddingBottom={Math.max(Platform.OS === "android" ? 36 : 14, insets.bottom)}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        const color = isActive ? accent : muted;
        return (
          <YStack
            key={tab.path}
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical={2}
            gap={4}
            onPress={() => router.replace(tab.path as any)}
            pressStyle={{ opacity: 0.7 }}
            cursor="pointer"
          >
            <YStack
              width={isActive ? 20 : 4}
              height={3}
              borderRadius={99}
              backgroundColor={isActive ? accent : "transparent"}
              marginBottom={4}
            />
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={color}
            />
            <Text
              fontSize={10}
              fontWeight={isActive ? "700" : "500"}
              letterSpacing={0.2}
              color={color}
            >
              {t(tab.labelKey)}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}
