// services/notificationService.ts (Expert/Consultant App)
import { getToken } from "@/utils/tokenHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import axios from "axios";
import { PermissionsAndroid, Platform } from "react-native";

const API_BASE_URL = "https://api.colio.in/api";
const NOTIFICATION_STORAGE_KEY = "@fcm_token";

class NotificationService {
  // ✅ Request notification permissions
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("[Expert] ✅ Notification permission granted");
          return true;
        } else {
          console.log("[Expert] ❌ Notification permission denied");
          return false;
        }
      } else {
        // Android < 13 doesn't need runtime permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log("[Expert] ✅ Notification permission granted (iOS)");
        }

        return enabled;
      }
    } catch (error) {
      console.error("[Expert] ❌ Error requesting permission:", error);
      return false;
    }
  }

  // ✅ Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        console.log("[Expert] ✅ FCM Token:", fcmToken);
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, fcmToken);
        return fcmToken;
      } else {
        console.log("[Expert] ⚠️ Failed to get FCM token");
        return null;
      }
    } catch (error) {
      console.error("[Expert] ❌ Error getting FCM token:", error);
      return null;
    }
  }

  // ✅ Register FCM token with backend
  async registerTokenWithBackend(fcmToken: string): Promise<boolean> {
    try {
      const authToken = await getToken();

      if (!authToken) {
        console.log("[Expert] ⚠️ No auth token found");
        return false;
      }

      console.log("[Expert] 📤 Sending FCM token to backend...");

      const response = await axios.post(
        `${API_BASE_URL}/notifications/register-token`,
        {
          fcmToken: fcmToken,
          platform: Platform.OS,
          deviceInfo: {
            version: Platform.Version,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        console.log("[Expert] ✅ FCM token registered successfully");
        return true;
      } else {
        console.error(
          "[Expert] ❌ Failed to register token:",
          response.data.message,
        );
        return false;
      }
    } catch (error: any) {
      console.error(
        "[Expert] ❌ Error sending token to backend:",
        error.response?.data || error.message,
      );
      return false;
    }
  }

  // ✅ Initialize notifications
  async initialize(): Promise<boolean> {
    try {
      console.log("[Expert] 🔔 Initializing Firebase Messaging...");

      // Request permissions
      const hasPermission = await this.requestNotificationPermission();

      if (!hasPermission) {
        console.log("[Expert] ⚠️ Notification permissions not granted");
        return false;
      }

      // Get FCM token
      const fcmToken = await this.getFCMToken();

      if (!fcmToken) {
        console.log("[Expert] ⚠️ Could not get FCM token");
        return false;
      }

      // Register with backend
      await this.registerTokenWithBackend(fcmToken);

      // Handle token refresh
      this.setupTokenRefreshListener();

      console.log("[Expert] ✅ Firebase Messaging initialized successfully");
      return true;
    } catch (error) {
      console.error("[Expert] ❌ Error initializing notifications:", error);
      return false;
    }
  }

  // ✅ Setup token refresh listener
  setupTokenRefreshListener() {
    messaging().onTokenRefresh(async (token) => {
      console.log("[Expert] 🔄 FCM Token refreshed:", token);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, token);
      await this.registerTokenWithBackend(token);
    });
  }

  // ✅ Remove FCM token from backend (on logout)
  async removeTokenFromBackend() {
    try {
      const authToken = await getToken();

      if (!authToken) return;

      await axios.post(
        `${API_BASE_URL}/notifications/remove-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // Remove from local storage
      await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);

      // Delete FCM token from device
      await messaging().deleteToken();

      console.log("[Expert] ✅ FCM token removed from backend and device");
    } catch (error) {
      console.error("[Expert] ❌ Error removing token from backend:", error);
    }
  }

  // ✅ Check if notifications are enabled
  async checkNotificationStatus(): Promise<boolean> {
    const fcmToken = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return !!fcmToken;
  }
}

export default new NotificationService();
