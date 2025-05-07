// app.config.js
import "dotenv/config";

export default ({ config }) => ({
  /* ─────────────── basic metadata ─────────────── */
  name: "Looper",
  slug: "looper",
  version: "1.0.0",
  sdkVersion: "53.0.0",

  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "looper",
  userInterfaceStyle: "automatic",

  /* ─────────────── secure keys ─────────────── */
  extra: {
    ...(config.extra || {}),
    googleApiKey: process.env.GOOGLE_API_KEY,
    // ⚠️  Leave out eas.projectId for now – we’ll add it after configure
  },

  /* ─────────────── iOS settings ─────────────── */
  ios: {
    ...config.ios,
    bundleIdentifier: "com.xpl0rr.looper",
    runtimeVersion: { policy: "appVersion" },
    supportsTablet: true,
  },

  /* ─────────────── Android settings ─────────── */
  android: {
    ...config.android,
    package: "com.xpl0rr.looper",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    runtimeVersion: { policy: "appVersion" },
  },

  /* ─────────────── Web build ─────────────── */
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  /* ─────────────── Plugins & flags ─────────── */
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: { typedRoutes: true },

  /* ─────────────── OTA / owner ─────────────── */
  owner: "xplorr",
  // updates.url will be added automatically when we paste the new projectId
});