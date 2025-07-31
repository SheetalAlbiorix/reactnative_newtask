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
    googleServicesFile: "./google-services.json",
  },
  ios: {
    bundleIdentifier: "com.tryperdiem.code",
    buildNumber: "1",
    googleServicesFile: "./GoogleService-Info.plist",
  },
  web: {
    bundler: "metro",
  },
  plugins: [
    "expo-font",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.1045753182166-lafiec0m92d4rk79bc0qkheuah52s7to",
      },
    ],
  ],
};

export default config;
