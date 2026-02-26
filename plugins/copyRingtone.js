// plugins/copyRingtone.js
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withRingtone(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const rawDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "raw",
      );

      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }

      const src = path.join(
        config.modRequest.projectRoot,
        "assets",
        "sounds",
        "ringtone.mp3",
      );
      const dest = path.join(rawDir, "ringtone.mp3");

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log("✅ ringtone.mp3 copied to android/app/src/main/res/raw/");
      } else {
        console.warn("⚠️ ringtone.mp3 not found at assets/sounds/ringtone.mp3");
      }

      return config;
    },
  ]);
};
