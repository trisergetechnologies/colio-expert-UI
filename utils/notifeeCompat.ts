type AnyFn = (...args: any[]) => any;

const noopAsync: AnyFn = async () => undefined;
const noopUnsub: AnyFn = () => () => undefined;

let realNotifee: any = null;

try {
  const pkg = "@notifee/react-native";
  // Dynamic require avoids Metro hard-failing when dependency is absent.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  realNotifee = require(pkg);
} catch (error) {
  console.warn("[notifeeCompat] @notifee/react-native not installed, using no-op fallback.");
}

const fallback = {
  registerForegroundService: ((_handler: AnyFn) => undefined) as AnyFn,
  onBackgroundEvent: ((_handler: AnyFn) => undefined) as AnyFn,
  onForegroundEvent: noopUnsub,
  createChannel: async () => "fallback-channel",
  displayNotification: noopAsync,
  stopForegroundService: noopAsync,
  cancelNotification: noopAsync,
  getDisplayedNotifications: async () => [],
  getInitialNotification: async () => null,
};

const notifeeModule = realNotifee ?? fallback;

export const AndroidCategory = notifeeModule.AndroidCategory ?? {
  CALL: "call",
};

export const AndroidImportance = notifeeModule.AndroidImportance ?? {
  HIGH: 4,
};

export const AndroidVisibility = notifeeModule.AndroidVisibility ?? {
  PUBLIC: 1,
};

export const EventType = notifeeModule.EventType ?? {
  PRESS: "press",
  ACTION_PRESS: "action_press",
};

const notifee = notifeeModule.default ?? notifeeModule;
export default notifee;
