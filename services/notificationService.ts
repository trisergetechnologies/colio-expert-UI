// services/notificationService.ts (Expert/Consultant App)
import { getToken } from '@/utils/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { PermissionsAndroid, Platform } from 'react-native';

const API_BASE_URL = 'https://api.colio.in/api';
const NOTIFICATION_STORAGE_KEY = '@fcm_token';

// ✅ Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

class NotificationService {
  private unsubscribeOnMessage: (() => void) | null = null;
  private unsubscribeOnNotificationOpenedApp: (() => void) | null = null;

  // ✅ Create Android notification channel (required for Android 8+)
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('incoming-call', {
        name: 'Incoming Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d946ef',
        sound: 'default',
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8900ae',
        sound: 'default',
      });
      
      console.log('[Expert] ✅ Notification channels created');
    }
  }

  // ✅ Request notification permissions
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[Expert] ✅ Notification permission granted');
          await this.createNotificationChannel();
          return true;
        } else {
          console.log('[Expert] ❌ Notification permission denied');
          return false;
        }
      } else {
        // Android < 13 doesn't need runtime permission
        await this.createNotificationChannel();
        
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('[Expert] ✅ Notification permission granted (iOS)');
        }

        return enabled;
      }
    } catch (error) {
      console.error('[Expert] ❌ Error requesting permission:', error);
      return false;
    }
  }

  // ✅ Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const fcmToken = await messaging().getToken();
      
      if (fcmToken) {
        console.log('[Expert] ✅ FCM Token:', fcmToken);
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, fcmToken);
        return fcmToken;
      } else {
        console.log('[Expert] ⚠️ Failed to get FCM token');
        return null;
      }
    } catch (error) {
      console.error('[Expert] ❌ Error getting FCM token:', error);
      return null;
    }
  }

  // ✅ Register FCM token with backend
  async registerTokenWithBackend(fcmToken: string): Promise<boolean> {
    try {
      const authToken = await getToken();
      
      if (!authToken) {
        console.log('[Expert] ⚠️ No auth token found');
        return false;
      }

      console.log('[Expert] 📤 Sending FCM token to backend...');

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
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        console.log('[Expert] ✅ FCM token registered successfully');
        return true;
      } else {
        console.error('[Expert] ❌ Failed to register token:', response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error('[Expert] ❌ Error sending token to backend:', error.response?.data || error.message);
      return false;
    }
  }

  // ✅ Initialize notifications
  async initialize(): Promise<boolean> {
    try {
      console.log('[Expert] 🔔 Initializing Firebase Messaging...');

      // Request permissions
      const hasPermission = await this.requestNotificationPermission();
      
      if (!hasPermission) {
        console.log('[Expert] ⚠️ Notification permissions not granted');
        return false;
      }

      // Get FCM token
      const fcmToken = await this.getFCMToken();
      
      if (!fcmToken) {
        console.log('[Expert] ⚠️ Could not get FCM token');
        return false;
      }

      // Register with backend
      await this.registerTokenWithBackend(fcmToken);

      // Setup listeners
      this.setupListeners();

      // Setup expo notification tap listener
      this.setupExpoNotificationListeners();

      // Handle token refresh
      this.setupTokenRefreshListener();

      console.log('[Expert] ✅ Firebase Messaging initialized successfully');
      return true;
    } catch (error) {
      console.error('[Expert] ❌ Error initializing notifications:', error);
      return false;
    }
  }

  // ✅ Setup notification listeners
  setupListeners() {
    // ===== FOREGROUND NOTIFICATIONS =====
    // Handle notifications when app is OPEN and ACTIVE
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('[Expert] 📩 Foreground notification received:', JSON.stringify(remoteMessage, null, 2));
      
      // ✅ CRITICAL FIX: Display the notification using expo-notifications
      await this.displayLocalNotification(remoteMessage);
      
      // Handle incoming call type
      if (remoteMessage.data?.type === 'incoming_call') {
        console.log('[Expert] 📞 INCOMING CALL NOTIFICATION!');
        
        // Navigate to incoming call screen after showing notification
        setTimeout(() => {
          this.handleIncomingCall(remoteMessage.data);
        }, 500);
      }
    });

    // ===== BACKGROUND NOTIFICATIONS =====
    // Handle notification opened app (from background state)
    this.unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log('[Expert] 👆 Notification opened app from background:', JSON.stringify(remoteMessage, null, 2));
        
        if (remoteMessage.data?.type === 'incoming_call') {
          this.handleIncomingCall(remoteMessage.data);
        } else if (remoteMessage.data?.type === 'welcome') {
          console.log('[Expert] 👋 Welcome notification opened');
          // Navigate to home or profile if needed
        }
      }
    );

    // ===== KILLED STATE NOTIFICATIONS =====
    // Check if app was opened by a notification (from completely closed state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[Expert] 👆 Notification opened app from quit state:', JSON.stringify(remoteMessage, null, 2));
          
          if (remoteMessage.data?.type === 'incoming_call') {
            this.handleIncomingCall(remoteMessage.data);
          } else if (remoteMessage.data?.type === 'welcome') {
            console.log('[Expert] 👋 Welcome notification opened from killed state');
          }
        }
      });

    console.log('[Expert] ✅ Notification listeners setup complete');
  }

  // ✅ Setup expo notification tap handler
  setupExpoNotificationListeners() {
    // Handle notification tap (when user taps the notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Expert] 👆 User tapped notification:', JSON.stringify(response, null, 2));
      
      const data = response.notification.request.content.data;
      
      if (data.type === 'incoming_call') {
        this.handleIncomingCall(data);
      } else if (data.type === 'welcome') {
        console.log('[Expert] 👋 Welcome notification tapped');
        // Navigate to home or profile if needed
      }
    });
    
    console.log('[Expert] ✅ Expo notification tap listener setup');
  }

  // ✅ Display local notification using expo-notifications
  // This is the CRITICAL FIX for foreground notifications
  private async displayLocalNotification(remoteMessage: any) {
    try {
      const { notification, data } = remoteMessage;

      if (!notification) {
        console.log('[Expert] ⚠️ No notification payload found');
        return;
      }

      // Determine if this is an incoming call for priority handling
      const isIncomingCall = data?.type === 'incoming_call';
      const channelId = isIncomingCall ? 'incoming-call' : 'default';

      // ✅ Display the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || 'Colio',
          body: notification.body || '',
          data: data || {},
          sound: 'default',
          priority: isIncomingCall 
            ? Notifications.AndroidNotificationPriority.MAX 
            : Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: channelId,
          vibrate: isIncomingCall ? [0, 250, 250, 250] : [0, 250],
          sticky: isIncomingCall, // Keep notification visible for calls
        },
        trigger: null, // Show immediately
      });
      
      console.log('[Expert] ✅ Local notification displayed:', notification.title);
    } catch (error) {
      console.error('[Expert] ❌ Error displaying local notification:', error);
    }
  }

  // ✅ Handle incoming call notification
  private handleIncomingCall(data: any) {
    console.log('[Expert] 🔔 Handling incoming call:', data);
    
    // Extract all call data
    const {
      sessionId,
      callType,
      channelName,
      customerId,
      customerName,
      customerAvatar,
      rtcToken,
      ratePerMinute,
      estimatedMaxDurationSeconds,
    } = data;

    // Navigate to incoming call screen
    router.push({
      pathname: '/(private)/incoming-call',
      params: {
        sessionId,
        callType,
        channelName,
        customerId,
        customerName: customerName || 'Unknown',
        customerAvatar: customerAvatar || '',
        rtcToken: rtcToken || '',
        ratePerMinute: ratePerMinute || '0',
        estimatedMaxDurationSeconds: estimatedMaxDurationSeconds || '0',
      },
    });
  }

  // ✅ Setup token refresh listener
  setupTokenRefreshListener() {
    messaging().onTokenRefresh(async (token) => {
      console.log('[Expert] 🔄 FCM Token refreshed:', token);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, token);
      await this.registerTokenWithBackend(token);
    });
  }

  // ✅ Remove notification listeners
  removeListeners() {
    console.log('[Expert] 🗑️ Removing notification listeners...');
    
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeOnNotificationOpenedApp) {
      this.unsubscribeOnNotificationOpenedApp();
    }
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
        }
      );

      // Remove from local storage
      await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      
      // Delete FCM token from device
      await messaging().deleteToken();
      
      console.log('[Expert] ✅ FCM token removed from backend and device');
    } catch (error) {
      console.error('[Expert] ❌ Error removing token from backend:', error);
    }
  }

  // ✅ Check if notifications are enabled
  async checkNotificationStatus(): Promise<boolean> {
    const fcmToken = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return !!fcmToken;
  }
}

export default new NotificationService();