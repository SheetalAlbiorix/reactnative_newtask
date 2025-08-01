import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

export const NotificationsAlert = () => {
  // to show the alert
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const scheduleNotification = (title: string, body: string) => {
    console.log("title: ", title, body);

    Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
      },
      trigger: null,
    });
  };

  return {
    scheduleNotification,
  };
};

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (!(status === "granted")) {
    Alert.alert(
      "Notification",
      "Notification permission not granted. Please enable from settings."
    );
  }

  return status === "granted";
}
