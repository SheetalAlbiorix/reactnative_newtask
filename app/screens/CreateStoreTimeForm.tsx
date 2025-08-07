import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Strings from "@/utils/Strings";
import { useTheme } from "@/utils/ThemeContext";

const CreateStoreTimeForm = ({
  newStoreTime,
  setNewStoreTime,
  showPicker,
  setShowStoreTimeModal,
  createNewStoreTime,
  loading,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.createFormContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.createFormHeader}>
        <Text style={[styles.createFormTitle, { color: theme.text }]}>
          ...
          {Strings.addRegularStoreHours}
        </Text>
        <TouchableOpacity
          style={[styles.closeFormButton, { backgroundColor: theme.surface }]}
          onPress={() => setShowStoreTimeModal(false)}
        >
          <Text style={[styles.closeFormButtonText, { color: theme.text }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createFormContent}>...</View>
    </View>
  );
};

const styles = StyleSheet.create({
  createFormContainer: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
  },
  createFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createFormTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeFormButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  closeFormButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  createFormContent: {
    gap: 16,
  },
});

export default CreateStoreTimeForm;
