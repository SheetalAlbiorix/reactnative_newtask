import React from "react";
import { View, StyleSheet } from "react-native";
import Screen from "@/components/Screen";
import { useTheme } from "@/utils/ThemeContext";
import Strings from "@/utils/Strings";
import { useLoginForm } from "@/hooks/useLoginForm";

// Modular components
import LoginHeader from "@/components/login/LoginHeader";
import EmailInput from "@/components/login/EmailInput";
import PasswordInput from "@/components/login/PasswordInput";
import LoginButton from "@/components/login/LoginButton";
import LoginSeparator from "@/components/login/LoginSeparator";
import GoogleLoginButton from "@/components/login/GoogleLoginButton";

const LoginScreen = () => {
  const { theme } = useTheme();

  const {
    email,
    password,
    showPassword,
    loading,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleEmailLogin,
    handleGoogleLogin,
    isFormValid,
  } = useLoginForm();

  return (
    <Screen useSafeArea style={{ backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LoginHeader title="Login" />

        {/* Email Input */}
        <EmailInput value={email} onChangeText={setEmail} placeholder="Email" />

        {/* Password Input */}
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          showPassword={showPassword}
          onTogglePassword={togglePasswordVisibility}
          placeholder="Password"
        />

        {/* Login Button */}
        <LoginButton
          onPress={handleEmailLogin}
          disabled={!isFormValid}
          loading={loading}
          title={Strings.login}
        />

        {/* Separator */}
        <LoginSeparator text={Strings.or} />

        {/* Google Login Button */}
        <GoogleLoginButton
          onPress={handleGoogleLogin}
          title={Strings.loginWithGoogle}
          loading={loading}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
});

export default LoginScreen;
