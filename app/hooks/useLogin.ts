import {
  authenticationUser,
  AuthRequest,
  AuthResponse,
} from "@/network/api/requests/auth";
import { useAuth } from "@/utils/AuthContext";
import { isValidEmail, isValidPassword } from "@/utils/Helper";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";
import React from "react";
import { Alert } from "react-native";

const UseLogin = () => {
  const { login } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  React.useEffect(
    () =>
      GoogleSignin.configure({
        webClientId: process.env.GOOGLE_LOGIN_CLIENT_ID || "",
        scopes: ["profile", "email"],
        offlineAccess: false,
      }),
    []
  );

  /**
   * Handles Google Sign-In
   */
  const loginWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userDetails = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (userDetails && idToken) {
        console.log("id token:", idToken);
      }
    } catch (error) {
      console.log("some other error happened", error);
    }
  };

  /**
   *
   * @param email
   * @param password
   * @returns
   */
  const loginWithEmail = (email: string, password: string) => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert("Invalid Password");
      return;
    }

    const request: AuthRequest = {
      email: email,
      password: password,
    };

    authenticationUser(request)
      .then((response: AuthResponse) => {
        console.error("Login response:", response);
        if (response.token && response.token.length > 0) {
          login(response.token);
          navigation.navigate("Home");
        } else {
          Alert.alert("Login failed", "Unknown error");
        }
      })
      .catch((error) => {
        Alert.alert("Login error", error.message || "An error occurred");
      });
  };

  return {
    loginWithGoogle,
    loginWithEmail,
  };
};

export default UseLogin;
