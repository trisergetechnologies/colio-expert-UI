import { getToken } from "@/utils/tokenHelper";
import axios from "axios";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

const API_BASE_URL = "https://api.colio.in/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn("Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;

  try {
    const jwt = await getToken();
    if (jwt && expoPushToken) {
      await axios.post(
        `${API_BASE_URL}/user/push-token`,
        { pushToken: expoPushToken },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
    }
  } catch (err) {
    console.error("Failed to register push token:", err);
  }

  return expoPushToken;
}
