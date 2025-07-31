import {
  authenticationUser,
  AuthRequest,
  AuthResponse,
} from "@/network/api/requests/auth";
import { useApp } from "@/utils/AppContext";
import { LoginType, useAuth } from "@/utils/AuthContext";
import { isValidEmail, isValidPassword } from "@/utils/Helper";
import Strings from "@/utils/Strings";
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
  const { setIsLoading } = useApp();
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
      const { idToken, accessToken } = await GoogleSignin.getTokens();

      if (userDetails && idToken) {
        login(idToken, LoginType.google);
        navigation.navigate("Home");
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
      Alert.alert(Strings.invalidEmail);
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert(Strings.invalidPassword);
      return;
    }

    const request: AuthRequest = {
      email: email,
      password: password,
    };

    setIsLoading(true);
    authenticationUser(request)
      .then((response: AuthResponse) => {
        setIsLoading();
        if (response.token && response.token.length > 0) {
          login(response.token);
          navigation.navigate("Home");
        } else {
          Alert.alert(Strings.loginFailed, Strings.unknownError);
        }
      })
      .catch((error) => {
        setIsLoading();
        Alert.alert(Strings.loginError, error.message || Strings.genericError);
      });
  };

  const logoutFromGoogle = async () => {
    try {
      await GoogleSignin.signOut();
      console.log("Logged out from Google");
    } catch (error) {
      console.error("Error logging out from Google:", error);
    }
  };

  return {
    loginWithGoogle,
    loginWithEmail,
    logoutFromGoogle,
  };
};

export default UseLogin;
