import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChangeText,
  placeholder = "Email",
}) => {
  const { theme } = useTheme();

  return (
    <TextInput
      placeholder={placeholder}
      style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
      keyboardType="email-address"
      autoCapitalize="none"
      placeholderTextColor={theme.placeholder}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
});

export default EmailInput;
