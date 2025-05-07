// app.config.js
import "dotenv/config";            // loads .env at build-time

export default ({ config }) => ({
  /** ───────────────── basic metadata ───────────────── */
  name: "the-app",
  slug: "the-app",
  version: "1.0.0",

  /** If you ever upgrade Expo SDK, bump only this: */
  sdkVersion: "53.0.0",

  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "the-app",
  userInterfaceStyle: "automatic",
  // Load secure keys from environment
  extra: {
    googleApiKey: process.env.GOOGLE_API_KEY,
  },

  /** ───────────────── iOS settings ───────────────── */
  ios: {
    ...config.ios,
    bundleIdentifier: "com.xpl0rr.theapp",
    runtimeVersion: "1.0.0",
    supportsTablet: true,
  },

  /** ───────────────── Android settings ────────────── */
  android: {
    ...config.android,
    package: "com.xpl0rr.theapp",          // matches iOS ID for clarity
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
  experiments: {
    typedRoutes: true,
  },

  /** ───────────────── Extra values (exposed at runtime) ───────────── */
  extra: {
    eas: {
      projectId: "00313952-01bd-448b-bdf6-e3a180b78cc3",
    },
    router: { origin: false },
  },

  /** ───────────────── OTA / owner info ────────────── */
  owner: "xplorr",
  updates: {
    url: "https://u.expo.dev/00313952-01bd-448b-bdf6-e3a180b78cc3",
  },
});