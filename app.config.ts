import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "tryperdiem",
  slug: "boilerplate",
  version: "1.0.0",
  icon: "./assets/branding/icon.png",
  newArchEnabled: true,
  userInterfaceStyle: "automatic",
  android: {
    package: "com.tryperdiem.code",
    versionCode: 1,
    edgeToEdgeEnabled: true,
  },
  ios: {
    bundleIdentifier: "com.tryperdiem.code",
    buildNumber: "1",
  },
  web: {
    bundler: "metro",
  },
  plugins: ["expo-font"],
};

export default config;
