import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

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
