// utils/rnAgora.ts (Consultant App)
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
} from "react-native-agora";

let engineInstance: IRtcEngine | null = null;
let isInitialized = false;

export async function createEngine(appId: string) {
  try {
    console.log("[Consultant] [rnAgora] Creating engine with appId:", appId);

    // ✅ If engine already exists AND is initialized, return it
    if (engineInstance && isInitialized) {
      console.log(
        "[Consultant] [rnAgora] ⚠ Engine already exists, returning existing instance",
      );
      return engineInstance;
    }

    // ✅ If engine exists but NOT initialized (edge case), release and recreate
    if (engineInstance && !isInitialized) {
      try {
        console.warn(
          "[Consultant] [rnAgora] ⚠ Found stale engine — releasing and recreating",
        );
        engineInstance.release();
      } catch {}
      engineInstance = null;
    }

    // ✅ Create fresh engine
    const engine = createAgoraRtcEngine();

    console.log("[Consultant] [rnAgora] Initializing engine...");

    const initResult = engine.initialize({
      appId: appId,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });

    console.log("[Consultant] [rnAgora] Initialize result:", initResult);

    if (initResult !== 0) {
      console.error(
        "[Consultant] [rnAgora] ❌ Initialize failed with code:",
        initResult,
      );
      return null;
    }

    isInitialized = true;

    // ✅ Set client role (broadcaster = can send audio/video)
    const roleResult = engine.setClientRole(
      ClientRoleType.ClientRoleBroadcaster,
    );

    console.log("[Consultant] [rnAgora] Set client role result:", roleResult);

    // ✅ Enable audio by default
    const audioResult = engine.enableAudio();
    console.log("[Consultant] [rnAgora] Enable audio result:", audioResult);

    engineInstance = engine;

    console.log(
      "[Consultant] [rnAgora] ✅ Engine created and initialized successfully!",
    );

    return engine;
  } catch (error) {
    console.error("[Consultant] [rnAgora] ❌ Engine creation error:", error);
    engineInstance = null;
    isInitialized = false;
    return null;
  }
}

export function getEngine() {
  return engineInstance;
}

export async function clearEngine() {
  try {
    if (engineInstance) {
      console.log("[Consultant] [rnAgora] Releasing engine...");
      engineInstance.leaveChannel();
      engineInstance.release();
    }
  } catch (e) {
    console.warn("[Consultant] [rnAgora] Release error:", e);
  } finally {
    engineInstance = null;
    isInitialized = false;
    console.log("[Consultant] [rnAgora] Engine instance cleared");
  }
}
