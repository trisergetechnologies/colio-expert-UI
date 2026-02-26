const {
  withMainActivity,
  createRunOncePlugin,
} = require("@expo/config-plugins");

/**
 * REMARK:
 * This plugin runs ONLY during EAS build.
 * It injects Android FLAG_SECURE into MainActivity.
 * This blocks screenshots and screen recording at OS level.
 */
function withScreenSecurity(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // REMARK:
    // Prevent double injection if plugin runs again
    if (contents.includes("FLAG_SECURE")) {
      return config;
    }

    // REMARK:
    // Import required Android class
    if (!contents.includes("WindowManager")) {
      contents = contents.replace(
        "import android.os.Bundle;",
        `import android.os.Bundle;
import android.view.WindowManager;`,
      );
    }

    // REMARK:
    // Apply FLAG_SECURE immediately when activity starts
    contents = contents.replace(
      "super.onCreate(savedInstanceState);",
      `super.onCreate(savedInstanceState);

        // REMARK:
        // FLAG_SECURE blocks:
        // - Power + Volume screenshots
        // - Screen recording
        // - Google Assistant screenshots
        getWindow().setFlags(
          WindowManager.LayoutParams.FLAG_SECURE,
          WindowManager.LayoutParams.FLAG_SECURE
        );`,
    );

    config.modResults.contents = contents;
    return config;
  });
}

// REMARK:
// createRunOncePlugin ensures this runs only once per build
module.exports = createRunOncePlugin(
  withScreenSecurity,
  "with-screen-security",
  "1.0.0",
);
