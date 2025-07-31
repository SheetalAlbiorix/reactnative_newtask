import { isValidEmail, isValidPassword } from "@/utils/Helper";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React from "react";
import { Alert } from "react-native";

const webClientId =
  "1045753182166-bnp2oo73jodnqfdo85utjbspq2h5931p.apps.googleusercontent.com";

const UseLogin = () => {
  React.useEffect(
    () =>
      GoogleSignin.configure({
        webClientId: webClientId,
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
  };
  return {
    loginWithGoogle,
    loginWithEmail,
  };
};

export default UseLogin;
