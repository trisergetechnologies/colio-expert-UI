// // src/utils/notificationHelper.ts (Consultant App)
// import { getToken } from "@/utils/tokenHelper";
// import axios from "axios";
// import * as Device from "expo-device";
// import * as Notifications from "expo-notifications";

// const API_BASE_URL = "https://api.colio.in/api";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true
//   }),
// });

// export async function registerForPushNotificationsAsync() {
//   if (!Device.isDevice) {
//     console.warn("[Consultant] Must use physical device for push notifications");
//     return null;
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;

//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== "granted") {
//     console.warn("[Consultant] Push notification permission not granted");
//     return null;
//   }
//   const tokenData = await Notifications.getExpoPushTokenAsync({
//     projectId: "da2b77e7-8db9-48d7-afb4-7a00b358a5d9"
//   });
//   const expoPushToken = tokenData.data;

//   console.log("[Consultant] Expo push token:", expoPushToken);

//   try {
//     const jwt = await getToken();
//     if (jwt && expoPushToken) {
//       await axios.post(
//         `${API_BASE_URL}/user/push-token`,
//         { pushToken: expoPushToken },
//         { headers: { Authorization: `Bearer ${jwt}` } }
//       );
//       console.log("[Consultant] Push token registered with backend");
//     }
//   } catch (err) {
//     console.error("[Consultant] Failed to register push token:", err);
//   }

//   return expoPushToken;
// }