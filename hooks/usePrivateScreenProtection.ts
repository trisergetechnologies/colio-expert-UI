import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { AppState, BackHandler, Platform } from "react-native";

/**
 * REMARK:
 * This hook controls WHEN protection is active.
 * Native FLAG_SECURE is always present,
 * but JS layer ensures re-enforcement on resume.
 */
export function usePrivateScreenProtection(enabled: boolean) {
  useEffect(() => {
    // REMARK:
    // Only Android supports real screenshot blocking
    if (!enabled || Platform.OS !== "android") return;

    let active = true;

    const enforce = async () => {
      try {
        // REMARK:
        // Reinforces screen protection from JS side
        await ScreenCapture.preventScreenCaptureAsync();
      } catch {
        // REMARK:
        // If protection fails, exit app for security
        BackHandler.exitApp();
      }
    };

    // REMARK:
    // Apply immediately
    enforce();

    // REMARK:
    // Re-apply when app comes back from background
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && active) {
        enforce();
      }
    });

    return () => {
      active = false;
      sub.remove();

      // REMARK:
      // We DO NOT re-enable screenshots
      // Security remains active while app lives
    };
  }, [enabled]);
}
