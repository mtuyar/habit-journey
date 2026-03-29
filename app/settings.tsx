import React, { useState, startTransition } from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, AppLanguage } from '@/store/useSettingsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { Text } from '@/components/ui/Text';
import { cn } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

const FONT_OPTIONS = [
  { label: 'A-', value: 0.9 },
  { label: 'A', value: 1.0 },
  { label: 'A+', value: 1.15 },
  { label: 'A++', value: 1.3 },
];

export default function SettingsScreen() {
  const { fontScale, setFontScale, isNotificationsEnabled, setNotificationsEnabled, notificationTime, setNotificationTime, language, setLanguage, isDarkMode, setDarkMode, geminiApiKey, setGeminiApiKey } = useSettingsStore();
  const { t } = useTranslation();
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const dateObj = new Date();
  dateObj.setHours(notificationTime.hour, notificationTime.minute, 0);

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setNotificationTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes()
      });
    }
  };

  // Directly access zustand store for deleting data
  const handleResetData = () => {
    Alert.alert(
      t('resetAlertTitle'),
      t('resetAlertDesc'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('resetAll'), 
          style: "destructive", 
          onPress: () => {
             useProgressStore.setState({ goals: [] });
             Alert.alert(t('success'), t('resetSuccessMsg'));
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-journeyBg dark:bg-journeyDarkBg">
      <View className="px-6 pt-4 pb-2 flex-row items-center border-b border-journeyBorder/30 dark:border-journeyDarkBorder/30">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center -ml-2 mr-2"
        >
          <Ionicons name="chevron-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-[20px] font-semibold text-journeyText dark:text-journeyDarkText">{t('settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-8">
          <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-[2px] mb-3 ml-2">{t('appearanceTitle')}</Text>
          <View className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder/40 dark:border-journeyDarkBorder/40 rounded-[28px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Text className="text-journeyText dark:text-journeyDarkText font-medium text-[15px] mb-4">{t('appFontSize')}</Text>
            
            <View className="flex-row items-center justify-between gap-2">
              {FONT_OPTIONS.map((opt) => {
                 const isActive = fontScale === opt.value;
                 return (
                   <TouchableOpacity
                     key={opt.label}
                     activeOpacity={0.7}
                     onPress={() => setFontScale(opt.value)}
                     className={cn(
                       "flex-1 items-center justify-center py-3 rounded-xl border",
                       isActive ? "bg-journeyAccent/10 dark:bg-journeyAccent/20 border-journeyAccent/40 dark:border-journeyAccent/60" : "bg-journeyBorder/20 dark:bg-[#334155]/20 border-journeyBorder/40 dark:border-journeyDarkBorder/40"
                     )}
                   >
                     <Text className={cn(
                       "font-semibold", 
                       isActive ? "text-journeyAccent" : "text-[#64748B] dark:text-journeyMuted"
                     )}>
                       {opt.label}
                     </Text>
                   </TouchableOpacity>
                 );
              })}
            </View>
            <Text className="text-journeyMuted dark:text-journeyMuted text-[12px] mt-4 leading-tight">
              {t('fontSizeDesc')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-[2px] mb-3 ml-2">{t('preferences')}</Text>
          <View className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder/40 dark:border-journeyDarkBorder/40 rounded-[28px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            
            <View className="flex-row items-center justify-between p-5 border-b border-journeyBorder/20 dark:border-journeyDarkBorder/20">
              <View className="flex-row items-center">
                <Ionicons name="language-outline" size={20} color="#64748B" />
                <Text className="text-journeyText dark:text-journeyDarkText text-[15px] font-medium ml-3">{t('appLanguage')}</Text>
              </View>
              <View className="flex-row bg-journeyBorder/20 dark:bg-[#334155]/20 p-1 rounded-xl">
                 <TouchableOpacity onPress={() => startTransition(() => setLanguage('tr'))} className={cn("px-3 py-1.5 rounded-lg", language === 'tr' ? "bg-journeyCard dark:bg-journeyDarkCard shadow-sm" : "")}>
                   <Text className={cn("text-[13px] font-semibold", language === 'tr' ? "text-journeyText dark:text-journeyDarkText" : "text-journeyMuted dark:text-journeyMuted")}>🇹🇷 TR</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => startTransition(() => setLanguage('en'))} className={cn("px-3 py-1.5 rounded-lg", language === 'en' ? "bg-journeyCard dark:bg-journeyDarkCard shadow-sm" : "")}>
                   <Text className={cn("text-[13px] font-semibold", language === 'en' ? "text-journeyText dark:text-journeyDarkText" : "text-journeyMuted dark:text-journeyMuted")}>🇬🇧 EN</Text>
                 </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-5 border-b border-journeyBorder/20 dark:border-journeyDarkBorder/20">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={20} color="#64748B" />
                <Text className="text-journeyText dark:text-journeyDarkText text-[15px] font-medium ml-3">{t('dailyReminders')}</Text>
              </View>
              <Switch 
                value={isNotificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#CBD5E1", true: "#14B8A6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isNotificationsEnabled && (
              <Animated.View entering={FadeInDown.springify()} className="border-b border-journeyBorder/20 dark:border-journeyDarkBorder/20">
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center justify-between p-5 bg-journeyBorder/10"
                  style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#64748B" />
                    <Text className="text-journeyText dark:text-journeyDarkText text-[15px] font-medium ml-3">{t('reminderTime')}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-journeyAccent font-bold text-[16px] mr-1">
                      {notificationTime.hour.toString().padStart(2, '0')}:{notificationTime.minute.toString().padStart(2, '0')}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#14B8A6" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View className={cn("flex-row items-center justify-between p-5", !isNotificationsEnabled && "border-t border-journeyBorder/20 dark:border-journeyDarkBorder/20")}>
              <View className="flex-row items-center">
                <Ionicons name="moon-outline" size={20} color="#64748B" />
                <Text className="text-journeyText dark:text-journeyDarkText text-[15px] font-medium ml-3">{t('darkMode')}</Text>
              </View>
              <Switch 
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#CBD5E1", true: "#14B8A6" }}
                thumbColor={isDarkMode ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>

          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
          <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-[2px] mb-3 ml-2">{t('aiSettingsTitle')}</Text>
          <View className="bg-journeyCard dark:bg-journeyDarkCard border border-journeyBorder/40 dark:border-journeyDarkBorder/40 rounded-[28px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
            
            <View className="flex-row items-center mb-4">
              <Ionicons name="sparkles-outline" size={20} color="#14B8A6" />
              <Text className="text-[13px] text-journeyText dark:text-journeyDarkText font-medium ml-3">{t('aiApiKeyLabel')}</Text>
            </View>
            
            <View className="bg-journeyBg/80 dark:bg-black/20 border border-journeyBorder/50 dark:border-journeyDarkBorder/50 rounded-xl overflow-hidden mb-2">
              <TextInput
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                placeholder={t('aiApiKeyPlaceholder')}
                placeholderTextColor="#94A3B8"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                className="px-4 py-3.5 text-[14px] text-journeyText dark:text-journeyDarkText min-h-[48px]"
              />
            </View>
            
            <Text className="text-[11px] text-journeyMuted dark:text-journeyMuted leading-relaxed">
              {t('aiApiKeyHelp')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
          <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-[2px] mb-3 ml-2">{t('dangerZone')}</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleResetData}
            className="bg-[#FEF2F2] dark:bg-[#450a0a] border border-[#FECACA] dark:border-[#7f1d1d] rounded-[24px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex-row items-center"
          >
            <View className="w-10 h-10 bg-journeyCard dark:bg-black/30 items-center justify-center rounded-full mr-4 shadow-sm">
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-[#EF4444] font-bold text-[15px]">{t('resetProgress')}</Text>
              <Text className="text-[#F87171] text-[12px] mt-1 pr-4 leading-tight">{t('resetDesc')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View className="items-center mt-4">
          <Text className="text-journeyMuted dark:text-journeyMuted text-[12px] font-medium">Alışkanlık Yolculuğum v1.0.0</Text>
          <Text className="text-journeyMuted dark:text-journeyMuted/60 text-[10px] mt-1">{t('appFooterSubtitle')}</Text>
        </View>

      </ScrollView>

      {/* Cross Platform Time Picker Integration */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateObj}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}
      {showTimePicker && Platform.OS === 'ios' && (
         <View 
           className="absolute bottom-0 w-full rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.15)] bg-journeyCard dark:bg-journeyDarkCard z-50 pt-2 pb-10" 
         >
           <View className="flex-row justify-end px-6 pt-4 pb-2">
             <TouchableOpacity onPress={() => setShowTimePicker(false)} className="bg-journeyAccent/10 px-5 py-2.5 rounded-[12px]">
               <Text className="text-journeyAccent font-bold text-[14px]">{t('confirmTime')}</Text>
             </TouchableOpacity>
           </View>
           <View className="items-center justify-center bg-journeyCard dark:bg-journeyDarkCard">
             <DateTimePicker
               value={dateObj}
               mode="time"
               is24Hour={true}
               display="spinner"
               onChange={onChangeTime}
               themeVariant={isDarkMode ? "dark" : "light"}
             />
           </View>
         </View>
      )}

    </SafeAreaView>
  );
}
