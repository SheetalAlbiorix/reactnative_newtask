import { useState } from "react";
import { isEmpty } from "@/utils/Helper";
import UseLogin from "@/hooks/useLogin";

export interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
}

export interface LoginFormActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  togglePasswordVisibility: () => void;
  handleEmailLogin: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  isFormValid: boolean;
}

export const useLoginForm = (): LoginFormState & LoginFormActions => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle, loginWithEmail } = UseLogin();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      await loginWithEmail(email, password);
    } catch (error) {
      console.error("Email login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !isEmpty(email) && !isEmpty(password);

  return {
    // State
    email,
    password,
    showPassword,
    loading,
    // Actions
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleEmailLogin,
    handleGoogleLogin,
    isFormValid,
  };
};
