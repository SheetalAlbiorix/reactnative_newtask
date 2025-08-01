import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { isEmpty } from "@/utils/Helper";
import UseLogin from "@/hooks/useLogin";
import Strings from "@/utils/Strings";
import { useTheme } from "@/utils/ThemeContext";

const LoginScreen = () => {
  const [email, setEmail] = useState("user@tryperdiem.com");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle, loginWithEmail } = UseLogin();
  const { theme } = useTheme();
  return (
    <Screen useSafeArea style={{ backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Login</Text>

        {/* Email Field */}
        <TextInput
          placeholder="Email"
          style={[
            styles.input,
            { borderColor: theme.primary, color: theme.text },
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
        />

        {/* Password Field */}
        <View
          style={[styles.passwordContainer, { borderColor: theme.primary }]}
        >
          <TextInput
            placeholder="Password"
            style={[styles.passwordInput, { color: theme.text }]}
            secureTextEntry={!showPassword}
            placeholderTextColor={theme.placeholder}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.placeholder}
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <Button
          variant="primary"
          onPress={() => loginWithEmail(email, password)}
          style={[styles.button, { backgroundColor: theme.primary }]}
          disabled={isEmpty(email) || isEmpty(password)}
        >
          {Strings.login}
        </Button>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View
            style={[styles.separatorLine, { backgroundColor: theme.divider }]}
          />
          <Text style={[styles.separatorText, { color: theme.textSecondary }]}>
            {Strings.or}
          </Text>
          <View
            style={[styles.separatorLine, { backgroundColor: theme.divider }]}
          />
        </View>

        {/* Google Login Button */}
        <Button
          variant="outline"
          onPress={() => loginWithGoogle()}
          style={[styles.googleButton, { borderColor: theme.primary }]}
        >
          <Image
            source={require("../../assets/images/google-logo.png")}
            style={styles.googleIcon}
          />
          <View style={styles.googleButtonContainer}>
            <Text style={[styles.googleButtonText, { color: theme.primary }]}>
              {Strings.loginWithGoogle}
            </Text>
          </View>
        </Button>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 48,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    marginTop: 8,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: "500",
  },
  googleButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    paddingLeft: 10,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
});

export default LoginScreen;
