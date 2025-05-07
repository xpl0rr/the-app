// app.config.js
import "dotenv/config"; // loads .env at build-time

export default ({ config }) => ({
  /** ───────────────── basic metadata ───────────────── */
  name: "Looper",
  slug: "looper",
  version: "1.0.0",
  sdkVersion: "53.0.0",

  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "looper",
  userInterfaceStyle: "automatic",

  /** ───────────────── secure keys & EAS project ───── */
  extra: {
    ...(config.extra || {}),
    googleApiKey: process.env.GOOGLE_API_KEY,
    eas: {
      projectId: "b8df7beb-58e2-487e-b6ea-63d4db151331", // ← new projectId
    },
  },

  /** ───────────────── iOS settings ───────────────── */
  ios: {
    ...config.ios,
    bundleIdentifier: "com.xpl0rr.looper",
    runtimeVersion: { policy: "appVersion" },
    supportsTablet: true,
  },

  /** ───────────────── Android settings ────────────── */
  android: {
    ...config.android,
    package: "com.xpl0rr.looper",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    runtimeVersion: { policy: "appVersion" },
  },

  /** ───────────────── Web / static build ──────────── */
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  /** ───────────────── Plugins & experiments ───────── */
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

  /** ───────────────── OTA / owner info ────────────── */
  owner: "xplorr",
  updates: {
    url: "https://u.expo.dev/b8df7beb-58e2-487e-b6ea-63d4db151331",
  },
});