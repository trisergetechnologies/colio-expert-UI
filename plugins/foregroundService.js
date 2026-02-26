// plugins/foregroundService.js
// Notifee already adds its ForegroundService to the manifest automatically.
// This plugin only runs during EAS builds (not expo start).
// We don't need to override the foregroundServiceType — Notifee's default
// 'shortService' works fine for keeping the ringtone alive.
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = withAndroidManifest((config) => {
  const manifest = config.modResults;

  // Guard: only runs during native builds
  if (!manifest?.manifest?.application?.[0]) {
    return config;
  }

  const application = manifest.manifest.application[0];

  if (!application.service) {
    application.service = [];
  }

  // Check if Notifee's service is already declared
  const notifeeService = application.service.find(
    (s) => s.$?.["android:name"] === "app.notifee.core.ForegroundService",
  );

  if (notifeeService) {
    // Remove the foregroundServiceType restriction so it accepts any type
    // This prevents the "not a subset" crash
    delete notifeeService.$["android:foregroundServiceType"];
  } else {
    // Add it without a foregroundServiceType restriction
    application.service.push({
      $: {
        "android:name": "app.notifee.core.ForegroundService",
        "android:exported": "false",
        "android:stopWithTask": "true",
      },
    });
  }

  return config;
});
