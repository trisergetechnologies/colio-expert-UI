type AnyFn = (...args: any[]) => any;

let realMessagingFactory: AnyFn | null = null;

try {
  const pkg = "@react-native-firebase/messaging";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(pkg);
  realMessagingFactory = mod?.default ?? mod;
} catch (error) {
  console.warn(
    "[messagingCompat] @react-native-firebase/messaging not installed, using no-op fallback."
  );
}

const fallbackFactory = () => ({
  setBackgroundMessageHandler: (_handler: AnyFn) => undefined,
  onMessage: (_handler: AnyFn) => () => undefined,
});

const messaging = (realMessagingFactory ?? fallbackFactory) as AnyFn;
export default messaging;
