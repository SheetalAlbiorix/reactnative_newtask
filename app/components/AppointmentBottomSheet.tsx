import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import DateSelector from "./DateSelector";
import TimeSlotsGrid from "./TimeSlotsGrid";

interface DateItem {
  id: string;
  date: Date;
  formattedDate: string;
  shortDate: string;
  dayName: string;
  isToday: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  hour: number;
  minute: number;
  isAvailable: boolean;
}

interface AppointmentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  dates: DateItem[];
  selectedDate: DateItem | null;
  timeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  loading: boolean;
  onDatePress: (dateItem: DateItem) => void;
  onTimeSlotPress: (timeSlot: TimeSlot) => void;
  onConfirmAppointment: () => Promise<void>;
  onClearSelection: () => void;
  getStoreStatus: (date: DateItem) => {
    isOpen: boolean;
    isOverride: boolean;
    statusText: string;
  };
  isStoreClosed: (date: DateItem) => boolean;
}

const AppointmentBottomSheet: React.FC<AppointmentBottomSheetProps> = ({
  visible,
  onClose,
  dates,
  selectedDate,
  timeSlots,
  selectedTimeSlot,
  loading,
  onDatePress,
  onTimeSlotPress,
  onConfirmAppointment,
  onClearSelection,
  getStoreStatus,
  isStoreClosed,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.bottomSheet, { backgroundColor: theme.background }]}
        >
          {/* Bottom Sheet Header */}
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>
              Select Date & Time
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSheetContent}>
            {/* Date Selection */}
            <View style={styles.bottomSheetDatesSection}>
              <Text
                style={[styles.bottomSheetSectionTitle, { color: theme.text }]}
              >
                Select Date
              </Text>
              <DateSelector
                dates={dates}
                selectedDate={selectedDate}
                onDatePress={onDatePress}
                getStoreStatus={getStoreStatus}
              />
            </View>

            {/* Time Slots */}
            {selectedDate && (
              <View style={styles.bottomSheetTimeSlotsSection}>
                <Text
                  style={[
                    styles.bottomSheetSectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Time Slots (NYC Time) - {selectedDate.formattedDate}
                </Text>
                {isStoreClosed(selectedDate) ? (
                  <View style={styles.closedContainer}>
                    <Text
                      style={[
                        styles.closedText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      🔒 Store is Closed
                    </Text>
                    <Text
                      style={[
                        styles.closedSubText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      No appointments available on this day
                    </Text>
                  </View>
                ) : (
                  <TimeSlotsGrid
                    timeSlots={timeSlots}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotPress={onTimeSlotPress}
                    loading={loading}
                  />
                )}
              </View>
            )}

            {/* Selected Appointment */}
            {selectedDate && selectedTimeSlot && (
              <View
                style={[
                  styles.bottomSheetAppointmentContainer,
                  { backgroundColor: theme.card, borderColor: theme.primary },
                ]}
              >
                <View style={styles.appointmentDetails}>
                  <Text
                    style={[styles.appointmentSummary, { color: theme.text }]}
                  >
                    📅 {selectedDate.shortDate} • 🕐 {selectedTimeSlot.time}
                  </Text>
                </View>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity
                    style={[
                      styles.compactButton,
                      styles.clearButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={onClearSelection}
                  >
                    <Text
                      style={[styles.compactButtonText, { color: theme.text }]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.compactButton,
                      styles.confirmButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={onConfirmAppointment}
                  >
                    <Text
                      style={[
                        styles.compactButtonText,
                        { color: theme.buttonText },
                      ]}
                    >
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.9,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetDatesSection: {
    marginBottom: 24,
  },
  bottomSheetTimeSlotsSection: {},
  bottomSheetSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  bottomSheetAppointmentContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  closedContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  closedText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  closedSubText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  appointmentSummary: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  appointmentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  compactButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default AppointmentBottomSheet;
