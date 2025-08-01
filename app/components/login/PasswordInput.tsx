import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/utils/ThemeContext";

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  placeholder?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  showPassword,
  onTogglePassword,
  placeholder = "Password",
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.passwordContainer, { borderColor: theme.primary }]}>
      <TextInput
        placeholder={placeholder}
        style={[styles.passwordInput, { color: theme.text }]}
        secureTextEntry={!showPassword}
        placeholderTextColor={theme.placeholder}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
        <Ionicons
          name={showPassword ? "eye-off" : "eye"}
          size={20}
          color={theme.placeholder}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
});

export default PasswordInput;
