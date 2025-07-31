import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { isEmpty } from "@/utils/Helper";
import UseLogin from "@/hooks/useLogin";
import Strings from "@/utils/Strings";
import Color from "@/utils/Color";

const LoginScreen = () => {
  const [email, setEmail] = useState("user@tryperdiem.com");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle, loginWithEmail } = UseLogin();

  return (
    <Screen useSafeArea>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        {/* Email Field */}
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password Field */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
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
              color={Color.gray}
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <Button
          variant="primary"
          onPress={() => loginWithEmail(email, password)}
          style={styles.button}
          disabled={isEmpty(email) || isEmpty(password)}
        >
          {Strings.login}
        </Button>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>{Strings.or}</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Google Login Button */}
        <Button
          variant="outline"
          onPress={() => loginWithGoogle()}
          style={styles.googleButton}
        >
          <Ionicons name="logo-google" size={20} color={Color.red} />
          <Text style={styles.googleButtonText}>
            {" "}
            {Strings.loginWithGoogle}
          </Text>
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
    backgroundColor: Color.white,
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
    borderColor: Color.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Color.lightGrey,
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
    backgroundColor: Color.lightGrey,
  },
  separatorText: {
    marginHorizontal: 12,
    color: Color.gray,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: Color.red,
  },
  googleButtonText: {
    color: Color.red,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LoginScreen;
