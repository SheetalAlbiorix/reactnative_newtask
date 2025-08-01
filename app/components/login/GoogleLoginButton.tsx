import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Button from "@/components/Button";
import { useTheme } from "@/utils/ThemeContext";

interface GoogleLoginButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onPress,
  title,
  loading = false,
}) => {
  const { theme } = useTheme();

  return (
    <Button
      variant="outline"
      onPress={onPress}
      style={[styles.googleButton, { borderColor: theme.primary }]}
      disabled={loading}
    >
      <Image
        source={require("../../../assets/images/google-logo.png")}
        style={styles.googleIcon}
      />
      <View style={styles.googleButtonContainer}>
        <Text style={[styles.googleButtonText, { color: theme.primary }]}>
          {loading ? "Signing in..." : title}
        </Text>
      </View>
    </Button>
  );
};

const styles = StyleSheet.create({
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

export default GoogleLoginButton;
