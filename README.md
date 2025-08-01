# TryPerdiem - React Native Expo App

A modern React Native application built with Expo, featuring authentication, store management, and appointment scheduling capabilities.

## 🏗️ Architecture Overview

This application follows a modular architecture pattern with:

- **TypeScript**: Full type safety throughout the application
- **Expo SDK 53**: Modern React Native development platform
- **React Navigation**: Navigation management with stack navigation
- **Context API**: State management for authentication, themes, and app state
- **NativeWind**: Tailwind CSS for React Native styling
- **Modular Components**: Reusable UI components with consistent theming
- **Custom Hooks**: Business logic separation and reusability

## � Features

- **Authentication System**
  - Email/password login
  - Google Sign-In integration
  - Secure token management with MMKV storage
  - Automatic session persistence

- **Theme System**
  - Light/dark mode support
  - System theme detection
  - Consistent theming across components
  - Custom color schemes

- **Store Management**
  - Store time management
  - Override scheduling
  - Appointment booking system

- **UI Components**
  - Modular login components
  - Custom input fields with validation
  - Loading indicators
  - Notification system
  - Safe area handling


## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Hardik120589/store-management.git
cd store-management
```

### 2. Install Dependencies
```bash
npm install
# generate native folders
npm run prebuild
```

### 3. Environment Configuration
Create environment variables for Google Sign-In:
- Set up Google OAuth credentials in your Google Cloud Console
- Configure the `GOOGLE_LOGIN_CLIENT_ID` environment variable
- Update the `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) files


### 4. Development Server
```bash
npm start
```

### 5. Platform-specific Commands
```bash
# Run on iOS
npm run ios

# Run on Android
npm run android

```

## 📁 Project Structure

```
app/
├── components/           # Reusable UI components
│   ├── login/           # Login-specific components
│   └── ...              # Other shared components
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
├── network/             # API client and endpoints
│   ├── api/            # API request handlers
│   └── types/          # Network type definitions
├── screens/            # Screen components
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and contexts
    ├── AuthContext.tsx # Authentication state management
    ├── ThemeContext.tsx# Theme management
    ├── AppContext.tsx  # Global app state
    └── Storage.ts      # Persistent storage utilities
```

## 🔧 Key Technologies

- **React Native**
- **Expo SDK**
- **TypeScript**: Type safety
- **React Navigation**
- **React Native MMKV**
- **Google Sign-In**
- **Expo Notifications**


## 🎯 Assumptions

1. **Authentication**: The app assumes users will primarily authenticate via email/password or Google Sign-In
2. **Network**: Requires internet connectivity for authentication and store management features
3. **Platform Support**: Optimized for iOS and Android (web support available but limited)
4. **Storage**: Uses MMKV for secure, persistent storage on device
5. **Notifications**: Configured for push notifications with sound and custom icons
6. **Theme**: Automatically detects and respects system theme preferences

## ⚠️ Limitations

1. **Offline Functionality**: Limited offline capabilities - authentication and store operations require network connectivity
2. **Web Platform**: Web support is available but may have limited functionality compared to native platforms
3. **Google Services**: Requires proper Google Services configuration for Google Sign-In to work
4. **Development Client**: Uses Expo development builds, which require additional setup for certain native features
5. **Push Notifications**: Notification functionality requires proper configuration of APNs (iOS) and FCM (Android)
6. **Environment Variables**: Some features depend on proper environment variable configuration


## 🏗️ Development Approach

### Architecture Decisions

1. **Context-Based State Management**: Chose React Context over Redux for simpler state management needs
2. **Modular Components**: Login components are split into focused, reusable modules
3. **Custom Hooks**: Business logic is extracted into custom hooks for better testability and reuse
4. **Type Safety**: Comprehensive TypeScript usage for better development experience and fewer runtime errors

### Code Organization

1. **Separation of Concerns**: Clear separation between UI components, business logic, and data management
2. **Consistent Theming**: Centralized theme management with support for light/dark modes
3. **Reusable Utilities**: Common functionality extracted into utility functions and contexts
4. **API Structure**: Organized API calls with proper error handling and type definitions

### Development Patterns

1. **Component Composition**: Building complex UIs from smaller, focused components
2. **Custom Hooks**: Encapsulating stateful logic and side effects
3. **Context Providers**: Managing global state with React Context

## 📝 Notes

- The app uses Expo's new architecture with React Native 0.79
- Google Sign-In requires proper configuration of OAuth credentials
- Theme switching is handled automatically based on system preferences
- Storage utilities use MMKV for better performance than AsyncStorage
- Navigation state is automatically persisted across app restarts
