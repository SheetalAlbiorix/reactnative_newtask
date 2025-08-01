import React from "react";
import { StyleSheet } from "react-native";
import Button from "@/components/Button";
import { useTheme } from "@/utils/ThemeContext";

interface LoginButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading?: boolean;
  title: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  onPress,
  disabled,
  loading = false,
  title,
}) => {
  const { theme } = useTheme();

  return (
    <Button
      variant="primary"
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.primary }]}
      disabled={disabled || loading}
    >
      {loading ? "Logging in..." : title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
  },
});

export default LoginButton;
