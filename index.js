// index.js — Native entry point
// Runs BEFORE any React component renders.
import notifee, {
    AndroidCategory,
    AndroidImportance,
    EventType,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { AppRegistry } from "react-native";

// ============================================================================
// ✅ FOREGROUND SERVICE HANDLER
// MUST be registered here in index.js, not in _layout.tsx.
// This keeps the process alive when screen is off, maintaining ringtone
// and vibration for the full duration of the incoming call.
// Without this: Android kills sound after ~1 second when screen turns off.
// ============================================================================
notifee.registerForegroundService((notification) => {
  return new Promise((resolve) => {
    console.log(
      "[ForegroundService] 🔔 Started for notification:",
      notification.id,
    );
    const sessionId = String(notification.data?.sessionId || "");

    // Poll every second — resolve (stop service) when notification is gone
    const checkInterval = setInterval(async () => {
      try {
        const displayed = await notifee.getDisplayedNotifications();
        const stillShowing = displayed.some(
          (n) =>
            n.id === sessionId ||
            String(n.notification?.data?.sessionId) === sessionId,
        );
        if (!stillShowing) {
          console.log(
            "[ForegroundService] 🛑 Notification dismissed — stopping service",
          );
          clearInterval(checkInterval);
          resolve();
        }
      } catch (e) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);

    // Safety: auto-stop after 60 seconds (call timeout)
    setTimeout(() => {
      console.log("[ForegroundService] ⏰ Timeout — stopping service");
      clearInterval(checkInterval);
      resolve();
    }, 60000);
  });
});

// ============================================================================
// HELPERS
// ============================================================================
async function displayIncomingCallNotification(data) {
  const sessionId = String(data.sessionId || "");
  console.log(
    "[Headless] 📞 Displaying notification with foreground service:",
    sessionId,
  );

  const channelId = await notifee.createChannel({
    id: "incoming-calls-v2",
    name: "Incoming Calls",
    importance: AndroidImportance.HIGH,
    sound: "ringtone",
    vibration: true,
    vibrationPattern: [300, 500],
    visibility: 1, // AndroidVisibility.PUBLIC — show on lock screen
  });

  await notifee.displayNotification({
    id: sessionId,
    title: `📞 Incoming ${data.callType || "Call"}`,
    body: `${data.customerName || "Customer"} is calling you...`,
    data: data,
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      ongoing: true,
      loopSound: true,
      autoCancel: false,
      sound: "ringtone",
      pressAction: { id: "default", launchActivity: "default" },
      fullScreenAction: { id: "default", launchActivity: "default" },
      actions: [
        { title: "❌ Decline", pressAction: { id: "decline" } },
        {
          title: "✅ Answer",
          pressAction: { id: "answer", launchActivity: "default" },
        },
      ],
      // ✅ KEY: Keeps process alive with screen off
      asForegroundService: true,
      visibility: 1, // AndroidVisibility.PUBLIC
      showTimestamp: true,
    },
  });

  console.log(
    "[Headless] ✅ Notification + foreground service started:",
    sessionId,
  );
}

async function cancelAndShowMissed(sessionId, customerName) {
  try {
    await notifee.stopForegroundService();
  } catch (e) {}
  await notifee.cancelNotification(sessionId);
  try {
    const displayed = await notifee.getDisplayedNotifications();
    for (const n of displayed) {
      const data = n.notification?.data;
      if (n.id === sessionId || String(data?.sessionId) === sessionId) {
        await notifee.cancelNotification(n.id);
      }
    }
  } catch (e) {}
  const missedChannelId = await notifee.createChannel({
    id: "missed-calls",
    name: "Missed Calls",
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    id: `missed_${sessionId}`,
    title: "📵 Missed Call",
    body: customerName
      ? `You missed a call from ${customerName}`
      : "You missed a call from a customer.",
    android: {
      channelId: missedChannelId,
      importance: AndroidImportance.HIGH,
      autoCancel: true,
      pressAction: { id: "default" },
    },
  });
  console.log("[Headless] ✅ Missed call shown:", sessionId);
}

// ============================================================================
// FIREBASE BACKGROUND HANDLER
// ============================================================================
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[Headless] 📩 FCM type:", remoteMessage.data?.type);
  if (remoteMessage.data?.type === "incoming_call") {
    await displayIncomingCallNotification(remoteMessage.data);
  }
  if (remoteMessage.data?.type === "call_cancelled") {
    const sessionId = String(remoteMessage.data.sessionId || "");
    if (sessionId) {
      await cancelAndShowMissed(
        sessionId,
        String(remoteMessage.data.customerName || ""),
      );
    }
  }
});

// ============================================================================
// NOTIFEE BACKGROUND EVENTS
// ============================================================================
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    const sessionId = detail.notification?.id;
    if (detail.pressAction?.id === "decline" && sessionId) {
      console.log("[Headless] ❌ Declined, sessionId:", sessionId);
      try {
        await notifee.stopForegroundService();
      } catch (e) {}
      await notifee.cancelNotification(sessionId);
      try {
        const token = await AsyncStorage.getItem("@auth_token");
        if (token) {
          await fetch(`https://api.colio.in/api/session/${sessionId}/end`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          console.log("[Headless] ✅ Decline sent to backend");
        }
      } catch (e) {
        console.error("[Headless] ❌ Decline API error:", e);
      }
    }
    if (detail.pressAction?.id === "answer") {
      console.log(
        "[Headless] ✅ Answer pressed — app will open via launchActivity",
      );
    }
  }
});

// ============================================================================
// APP REGISTRY — must be last
// ============================================================================
const { ExpoRoot } = require("expo-router");
AppRegistry.registerComponent("main", () => ExpoRoot);
