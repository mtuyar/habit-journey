import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailyReminder, cancelDailyReminder } from '@/lib/notifications';

export type AppLanguage = 'tr' | 'en';

interface SettingsState {
  fontScale: number;
  setFontScale: (scale: number) => void;
  
  isNotificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  
  notificationTime: { hour: number; minute: number };
  setNotificationTime: (time: { hour: number; minute: number }) => void;
  
  isDarkMode: boolean;
  setDarkMode: (v: boolean) => void;

  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;

  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      fontScale: 1.0,
      setFontScale: (scale) => set({ fontScale: scale }),
      
      isNotificationsEnabled: false,
      setNotificationsEnabled: (isNotificationsEnabled) => {
        set({ isNotificationsEnabled });
        if (isNotificationsEnabled) {
          const { hour, minute } = get().notificationTime;
          scheduleDailyReminder(hour, minute);
        } else {
          cancelDailyReminder();
        }
      },

      notificationTime: { hour: 20, minute: 30 },
      setNotificationTime: (time) => {
        set({ notificationTime: time });
        if (get().isNotificationsEnabled) {
          scheduleDailyReminder(time.hour, time.minute);
        }
      },
      
      isDarkMode: false,
      setDarkMode: (isDarkMode) => set({ isDarkMode }),

      language: 'tr',
      setLanguage: (language) => set({ language }),

      geminiApiKey: '',
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: 'habit-journey-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
