import 'dotenv/config';

export default {
  expo: {
    name: "linkle",
    slug: "linkle",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.miniwa00.linkle"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.miniwa00.linkle"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY,
    },
  },
}; 