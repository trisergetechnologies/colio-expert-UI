// app.config.js
// REMARK:
// Wrapper config – app.json remains untouched

import appJson from "./app.json";

export default {
  ...appJson,

  expo: {
    ...appJson.expo,

    // REMARK:
    // ONLY custom config plugins go here
    plugins: [
      ...(appJson.expo?.plugins || []),

      // REMARK:
      // This is OUR native plugin that injects FLAG_SECURE
      "./plugins/withScreenSecurity",
    ],
  },
};