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

  /* ─────────────── secure keys & EAS project ───── */
  extra: {
    ...(config.extra || {}),
    googleApiKey: process.env.GOOGLE_API_KEY,
    eas: {
      projectId: "7cf84943-4995-4348-91d4-6a808797415b",
    },
  },

  /* ─────────────── iOS settings ─────────────── */
  ios: {
    ...config.ios,
    bundleIdentifier: "com.xpl0rr.looper",
    runtimeVersion: "1.0.0",
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
    runtimeVersion: "1.0.0",
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
  updates: {
    url: "https://u.expo.dev/7cf84943-4995-4348-91d4-6a808797415b",
  },
});