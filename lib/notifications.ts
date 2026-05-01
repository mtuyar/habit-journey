import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Alert } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');
let _notifications: NotificationsModule | null = null;
let _handlerInitialized = false;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  if (_notifications) return _notifications;
  _notifications = require('expo-notifications') as NotificationsModule;
  if (!_handlerInitialized) {
    _notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    _handlerInitialized = true;
  }
  return _notifications;
}

function warnExpoGo() {
  Alert.alert(
    'Bildirimler için Geliştirme Derlemesi Gerekli',
    'Expo Go (Android) artık bildirimleri desteklemiyor. Bildirimleri kullanmak için bir geliştirme derlemesi (development build) çalıştırın.',
  );
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    warnExpoGo();
    return false;
  }

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
  const Notifications = getNotifications();
  if (!Notifications) {
    warnExpoGo();
    return false;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Alışkanlık Yolculuğum",
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
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
