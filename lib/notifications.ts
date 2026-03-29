import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Günlük Hatırlatıcı',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert('Erişim Reddedildi', 'Bildirim alabilmek için ayarlardan izin vermeniz gerekmektedir.');
    return false;
  }
  
  return true;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  try {
    // Clear any existing notifications first to ensure only 1 active reminder
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Use Expo's standard daily trigger structure
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Alışkanlık Yolculuğum 🚀",
        body: "Günün hedeflerini tamamlamak için güzel bir vakit! Zinciri kırma.",
        sound: true,
      },
      trigger: {
        type: 'calendar',
        hour: hour,
        minute: minute,
        repeats: true,
      } as any,
    });

    return true;
  } catch (error) {
    console.error('Error scheduling notification: ', error);
    return false;
  }
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
