import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import { StorageKey, StorageUtils } from "./Storage";

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledDate: string;
  scheduledTime: string;
  notificationId: string;
  createdAt: string;
}

export const initNotification = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
    }),
  });
};

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (!(status === "granted")) {
    Alert.alert(
      "Notification",
      "Notification permission not granted. Please enable from settings."
    );
    return;
  }
  initNotification();
  return status === "granted";
}

export const scheduleNotification = (title: string, body: string) => {
  Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
    },
    trigger: null,
  });
};

export const scheduleNotificationAtTime = async (
  title: string,
  body: string,
  scheduledDate: Date
): Promise<string | null> => {
  try {
    // Check if the scheduled time is in the future
    if (scheduledDate <= new Date()) {
      Alert.alert("Error", "Please select a future date and time");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    Alert.alert("Error", "Failed to schedule notification");
    return null;
  }
};

export const cancelNotification = async (
  notificationId: string
): Promise<boolean> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error("Error cancelling notification:", error);
    return false;
  }
};

export const saveScheduledNotification = (
  notification: ScheduledNotification
) => {
  const existingNotifications = getScheduledNotifications();
  const updatedNotifications = [...existingNotifications, notification];
  StorageUtils.set(StorageKey.SCHEDULED_APPOINTMENTS, updatedNotifications);
};

export const getScheduledNotifications = (): ScheduledNotification[] => {
  const notifications = StorageUtils.get<ScheduledNotification[]>(
    StorageKey.SCHEDULED_APPOINTMENTS
  );
  return notifications || [];
};

export const removeScheduledNotification = (id: string) => {
  const existingNotifications = getScheduledNotifications();
  const updatedNotifications = existingNotifications.filter(
    (notification) => notification.id !== id
  );
  StorageUtils.set(StorageKey.SCHEDULED_APPOINTMENTS, updatedNotifications);
};

export const clearAllScheduledNotifications = () => {
  StorageUtils.set(StorageKey.SCHEDULED_APPOINTMENTS, []);
};
