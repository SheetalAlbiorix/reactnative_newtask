import React from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface LoginHeaderProps {
  title: string;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ title }) => {
  const { theme } = useTheme();

  return <Text style={[styles.title, { color: theme.primary }]}>{title}</Text>;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
});

export default LoginHeader;
