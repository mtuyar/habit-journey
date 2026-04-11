import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/lib/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';

const TABS = [
  {
    path: '/',
    icon: 'leaf-outline' as const,
    activeIcon: 'leaf' as const,
    labelKey: 'tabHome' as const,
  },
  {
    path: '/insights',
    icon: 'bar-chart-outline' as const,
    activeIcon: 'bar-chart' as const,
    labelKey: 'tabStats' as const,
  },
  {
    path: '/settings',
    icon: 'settings-outline' as const,
    activeIcon: 'settings' as const,
    labelKey: 'tabSettings' as const,
  },
] as const;

const TAB_SCREENS = new Set(['/', '/insights', '/settings']);

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isDarkMode = useSettingsStore(state => state.isDarkMode);

  if (!TAB_SCREENS.has(pathname)) return null;

  const bg = isDarkMode ? '#0E3330' : '#FFFFFF';
  const border = isDarkMode ? '#1B5E58' : '#B2F0E8';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: bg,
        borderTopWidth: 1,
        borderTopColor: border,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        paddingHorizontal: 8,
      }}
    >
      {TABS.map(tab => {
        const isActive = pathname === tab.path;
        const iconColor = isActive ? '#0D9488' : '#5F8B8A';

        return (
          <TouchableOpacity
            key={tab.path}
            activeOpacity={0.7}
            onPress={() => router.replace(tab.path as any)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 2,
            }}
          >
            {/* Active indicator pill */}
            <View
              style={{
                width: isActive ? 20 : 4,
                height: 3,
                borderRadius: 99,
                backgroundColor: isActive ? '#0D9488' : 'transparent',
                marginBottom: 4,
                alignSelf: 'center',
              }}
            />
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={iconColor}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: isActive ? '700' : '500',
                color: iconColor,
                letterSpacing: 0.2,
              }}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
