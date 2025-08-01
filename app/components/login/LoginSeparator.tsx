import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface LoginSeparatorProps {
  text: string;
}

const LoginSeparator: React.FC<LoginSeparatorProps> = ({ text }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.separatorContainer}>
      <View
        style={[styles.separatorLine, { backgroundColor: theme.divider }]}
      />
      <Text style={[styles.separatorText, { color: theme.textSecondary }]}>
        {text}
      </Text>
      <View
        style={[styles.separatorLine, { backgroundColor: theme.divider }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default LoginSeparator;
