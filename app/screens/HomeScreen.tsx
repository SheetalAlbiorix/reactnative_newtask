import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import CustomAlert from "@/components/CustomAlert";
import Input from "@/components/Input";
import StoreTimesList from "@/components/StoreTimesList";
import StoreOverridesList from "@/components/StoreOverridesList";
import AppointmentBottomSheet from "@/components/AppointmentBottomSheet";
import NotificationsList from "@/components/NotificationsList";
import { useAuth } from "@/utils/AuthContext";
import { format, formatInTimeZone } from "date-fns-tz";
import { createStoreTime } from "@/network/api/requests/store-times";
import { createStoreOverride } from "@/network/api/requests/store-override";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStoreManagement } from "@/hooks/useStoreManagement";
import { Clock } from "lucide-react-native";
import Strings from "@/utils/Strings";
import {
  getDayName,
  getGreeting,
  getLocalCity,
  getMonthName,
} from "@/utils/Helper";

const HomeScreen = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();

  // Helper function for string templating
  const formatString = (
    template: string,
    values: Record<string, string | number>
  ) => {
    return template.replace(/\{(\w+)\}/g, (match, key) =>
      String(values[key] || match)
    );
  };

  // Use custom hook for store management
  const {
    selectedDate,
    timeSlots,
    storeTimes,
    storeOverrides,
    loading,
    selectedTimeSlot,
    scheduledNotifications,
    next30Days,
    handleDatePress,
    handleTimeSlotPress,
    deleteStoreTime: hookDeleteStoreTime,
    deleteStoreOverride: hookDeleteStoreOverride,
    confirmAppointment,
    handleCancelNotification,
    clearSelection,
    getStoreStatus,
    isStoreClosed,
    fetchAllStoreTimes,
    fetchAllStoreOverrides,
  } = useStoreManagement();

  // Local state
  const [useNewYorkTime, setUseNewYorkTime] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState<
    "storeTime" | "override" | null
  >(null);
  const [isRegularHoursExpanded, setIsRegularHoursExpanded] = useState(true);
  const [isOverridesExpanded, setIsOverridesExpanded] = useState(true);
  const [showStoreTimeModal, setShowStoreTimeModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState<{
    type: "time" | "date";
    field: "start_time" | "end_time" | "month" | "day" | "scheduledDate";
    formType: "storeTime" | "override" | "notification";
  } | null>(null);
  const [tempPickerValue, setTempPickerValue] = useState<Date>(new Date());
  const [newStoreTime, setNewStoreTime] = useState({
    day_of_week: 0,
    start_time: "09:00",
    end_time: "17:00",
    is_open: true,
  });
  const [newOverride, setNewOverride] = useState({
    day: 1,
    month: 1,
    start_time: "09:00",
    end_time: "17:00",
    is_open: true,
  });
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to show confirmation alert
  const showConfirmationAlert = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Delete"
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  };

  // Helper function to hide alert
  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Wrapper functions for delete operations with confirmation
  const deleteStoreTime = (storeTimeId: string) => {
    const item = storeTimes.find((st) => st.id === storeTimeId);
    if (item) {
      showConfirmationAlert(
        Strings.deleteStoreHours,
        formatString(Strings.deleteStoreHoursConfirm, {
          dayName: getDayName(item.day_of_week),
        }),
        () => hookDeleteStoreTime(storeTimeId),
        Strings.delete
      );
    }
  };

  const deleteStoreOverride = (storeOverrideId: string) => {
    const item = storeOverrides.find((so) => so.id === storeOverrideId);
    if (item) {
      showConfirmationAlert(
        Strings.deleteOverride,
        formatString(Strings.deleteOverrideConfirm, {
          overrideDate: formatOverrideDate(item.month, item.day),
        }),
        () => hookDeleteStoreOverride(storeOverrideId),
        Strings.delete
      );
    }
  };

  const handleCancelNotificationWithConfirm = (notification: any) => {
    showConfirmationAlert(
      Strings.cancelNotification,
      Strings.cancelNotificationConfirm,
      () => handleCancelNotification(notification),
      Strings.delete
    );
  };

  // Create store time
  const createNewStoreTime = async () => {
    try {
      // Validate end time is at least 1 minute after start time
      if (newStoreTime.is_open) {
        const [startHours, startMinutes] = newStoreTime.start_time
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = newStoreTime.end_time
          .split(":")
          .map(Number);

        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;

        if (endTimeInMinutes <= startTimeInMinutes) {
          alert(Strings.endTimeValidation);
          return;
        }
      }

      const existingStoreTime = storeTimes.find(
        (st) => st.day_of_week === newStoreTime.day_of_week
      );
      if (existingStoreTime) {
        alert(
          formatString(Strings.storeTimeExistsError, {
            dayName: getDayName(newStoreTime.day_of_week),
          })
        );
        return;
      }

      await createStoreTime(newStoreTime);
      await fetchAllStoreTimes();

      setNewStoreTime({
        day_of_week: 0,
        start_time: "09:00",
        end_time: "17:00",
        is_open: true,
      });
      setShowStoreTimeModal(false);
    } catch (error) {
      console.error("Error creating store time:", error);
      alert(Strings.errorCreatingStoreTime);
    }
  };

  // Create store override
  const createNewOverride = async () => {
    try {
      // Validate end time is at least 1 minute after start time
      if (newOverride.is_open) {
        const [startHours, startMinutes] = newOverride.start_time
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = newOverride.end_time
          .split(":")
          .map(Number);

        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;

        if (endTimeInMinutes <= startTimeInMinutes) {
          alert(Strings.endTimeValidation);
          return;
        }
      }

      const existingOverride = storeOverrides.find(
        (so) => so.month === newOverride.month && so.day === newOverride.day
      );
      if (existingOverride) {
        alert(
          formatString(Strings.overrideExistsError, {
            overrideDate: formatOverrideDate(
              newOverride.month,
              newOverride.day
            ),
          })
        );
        return;
      }

      await createStoreOverride(newOverride);
      await fetchAllStoreOverrides();

      setNewOverride({
        day: 1,
        month: 1,
        start_time: "09:00",
        end_time: "17:00",
        is_open: true,
      });
      setShowOverrideModal(false);
    } catch (error) {
      console.error("Error creating store override:", error);
      alert(Strings.errorCreatingStoreOverride);
    }
  };

  // Appointment confirmation with alert
  const handleConfirmAppointment = async () => {
    try {
      const result = await confirmAppointment();
      if (result) {
        setIsBottomSheetVisible(false);
        alert(
          formatString(Strings.appointmentConfirmed, {
            nycTime: result.nycTime,
            localTime: result.localTime,
          })
        );
        clearSelection();
      }
    } catch (error) {
      alert(Strings.errorConfirmingAppointment);
    }
  };

  // Get formatted time based on selected timezone
  const getFormattedTime = () => {
    if (useNewYorkTime) {
      return formatInTimeZone(currentTime, "America/New_York", "PPpp");
    } else {
      return format(currentTime, "PPpp");
    }
  };

  // Get greeting message with city and timezone indicator
  const getGreetingMessage = () => {
    const greeting = getGreeting();
    const city = useNewYorkTime ? Strings.nyc : getLocalCity();

    if (greeting === Strings.nightOwl) {
      return `${greeting} in ${city}!`;
    }

    return `${greeting}, ${city}!`;
  };

  // Format date for store override display
  const formatOverrideDate = (month: number, day: number): string => {
    const monthName = getMonthName(month);
    return `${monthName} ${day}`;
  };

  // Handle date/time picker change
  const handleDateTimePickerChange = (event: any, selectedValue?: Date) => {
    // console.log("Picker changed:", event, selectedValue);

    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowDateTimePicker(null);
        return;
      } else if (event.type === "set") {
        setTempPickerValue(selectedValue);
        if (selectedValue) {
          handleDateTimePickerDone();
        }
      }
    } else if (selectedValue) {
      setTempPickerValue(selectedValue);
    }
  };

  // Handle date/time picker done button
  const handleDateTimePickerDone = () => {
    if (!showDateTimePicker) {
      setShowDateTimePicker(null);
      return;
    }

    const { type, field, formType } = showDateTimePicker;

    if (formType === "storeTime") {
      if (type === "time") {
        const timeString = tempPickerValue.toTimeString().slice(0, 5);
        setNewStoreTime((prev) => ({
          ...prev,
          [field]: timeString,
        }));
      }
    } else if (formType === "override") {
      if (type === "time") {
        const timeString = tempPickerValue.toTimeString().slice(0, 5);
        setNewOverride((prev) => ({
          ...prev,
          [field]: timeString,
        }));
      } else if (type === "date") {
        if (field === "month") {
          setNewOverride((prev) => ({
            ...prev,
            month: tempPickerValue.getMonth() + 1,
          }));
        } else if (field === "day") {
          setNewOverride((prev) => ({
            ...prev,
            day: tempPickerValue.getDate(),
          }));
        }
      }
    }

    setShowDateTimePicker(null);
  };

  // Show date/time picker
  const showPicker = (
    type: "time" | "date",
    field: "start_time" | "end_time" | "month" | "day" | "scheduledDate",
    formType: "storeTime" | "override" | "notification"
  ) => {
    setShowDateTimePicker({ type, field, formType });
    // Initialize temp value with current value
    setTempPickerValue(getPickerValue());
  };

  // Get current date/time value for picker
  const getPickerValue = (): Date => {
    if (!showDateTimePicker) return new Date();

    const { type, field, formType } = showDateTimePicker;

    if (formType === "storeTime" && type === "time") {
      const timeStr =
        field === "start_time"
          ? newStoreTime.start_time
          : newStoreTime.end_time;
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } else if (formType === "override") {
      if (type === "time") {
        const timeStr =
          field === "start_time"
            ? newOverride.start_time
            : newOverride.end_time;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      } else if (type === "date") {
        const date = new Date();
        if (field === "month") {
          date.setMonth(newOverride.month - 1);
        } else if (field === "day") {
          date.setDate(newOverride.day);
        }
        return date;
      }
    }

    return new Date();
  };

  // Render create store time form
  const renderCreateStoreTimeForm = () => (
    <View
      style={[
        styles.createFormContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.createFormHeader}>
        <Text style={[styles.createFormTitle, { color: theme.text }]}>
          Add Regular Store Hours
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

      <View style={styles.createFormContent}>
        {/* Day Selection */}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.text }]}>
            Day of Week
          </Text>
          <View style={styles.daySelector}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor:
                      newStoreTime.day_of_week === day
                        ? theme.primary
                        : theme.surface,
                  },
                ]}
                onPress={() =>
                  setNewStoreTime({ ...newStoreTime, day_of_week: day })
                }
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    {
                      color:
                        newStoreTime.day_of_week === day
                          ? theme.buttonText
                          : theme.text,
                    },
                  ]}
                >
                  {getDayName(day).slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Toggle */}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: newStoreTime.is_open
                    ? theme.primary
                    : theme.surface,
                },
              ]}
              onPress={() =>
                setNewStoreTime({ ...newStoreTime, is_open: true })
              }
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: newStoreTime.is_open ? theme.buttonText : theme.text,
                  },
                ]}
              >
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: !newStoreTime.is_open
                    ? theme.primary
                    : theme.surface,
                },
              ]}
              onPress={() =>
                setNewStoreTime({ ...newStoreTime, is_open: false })
              }
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: !newStoreTime.is_open
                      ? theme.buttonText
                      : theme.text,
                  },
                ]}
              >
                Closed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Fields */}
        {newStoreTime.is_open && (
          <>
            <TouchableOpacity
              onPress={() => showPicker("time", "start_time", "storeTime")}
            >
              <Input
                label="Start Time"
                value={newStoreTime.start_time}
                placeholder="Select start time"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showPicker("time", "end_time", "storeTime")}
            >
              <Input
                label="End Time"
                value={newStoreTime.end_time}
                placeholder="Select end time"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.formActions}>
          <Button
            onPress={() => setShowStoreTimeModal(false)}
            variant="outline"
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onPress={createNewStoreTime}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </View>
      </View>
    </View>
  );

  // Render create override form
  const renderCreateOverrideForm = () => (
    <View
      style={[
        styles.createFormContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.createFormHeader}>
        <Text style={[styles.createFormTitle, { color: theme.text }]}>
          Add Special Day Override
        </Text>
        <TouchableOpacity
          style={[styles.closeFormButton, { backgroundColor: theme.surface }]}
          onPress={() => setShowOverrideModal(false)}
        >
          <Text style={[styles.closeFormButtonText, { color: theme.text }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createFormContent}>
        {/* Month Selection */}
        <TouchableOpacity
          onPress={() => showPicker("date", "month", "override")}
        >
          <Input
            label="Month"
            value={getMonthName(newOverride.month)}
            placeholder="Select month"
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Day Selection */}
        <TouchableOpacity onPress={() => showPicker("date", "day", "override")}>
          <Input
            label="Day"
            value={newOverride.day.toString()}
            placeholder="Select day"
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Status Toggle */}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Status</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: newOverride.is_open
                    ? theme.primary
                    : theme.surface,
                },
              ]}
              onPress={() => setNewOverride({ ...newOverride, is_open: true })}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: newOverride.is_open ? theme.buttonText : theme.text,
                  },
                ]}
              >
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: !newOverride.is_open
                    ? theme.primary
                    : theme.surface,
                },
              ]}
              onPress={() => setNewOverride({ ...newOverride, is_open: false })}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: !newOverride.is_open ? theme.buttonText : theme.text,
                  },
                ]}
              >
                Closed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Fields */}
        {newOverride.is_open && (
          <>
            <TouchableOpacity
              onPress={() => showPicker("time", "start_time", "override")}
            >
              <Input
                label="Start Time"
                value={newOverride.start_time}
                placeholder="Select start time"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showPicker("time", "end_time", "override")}
            >
              <Input
                label="End Time"
                value={newOverride.end_time}
                placeholder="Select end time"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.formActions}>
          <Button
            onPress={() => setShowOverrideModal(false)}
            variant="outline"
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onPress={createNewOverride}
            disabled={loading}
            style={{ flex: 1, backgroundColor: theme.warning }}
          >
            {loading ? "Creating..." : "Create Override"}
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <Screen useSafeArea>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            {getGreetingMessage()}
          </Text>
          <Text style={[styles.headerTime, { color: theme.textSecondary }]}>
            {getFormattedTime()}
          </Text>
        </View>
        {/* <View style={styles.headerRight}> */}
        <TouchableOpacity
          style={[styles.exitButton, { backgroundColor: theme.error }]}
          onPress={() =>
            showConfirmationAlert(
              "Log Out",
              "Are you sure you want to log out?",
              logout,
              "Log Out"
            )
          }
        >
          <Text style={[styles.exitButtonText, { color: theme.card }]}>
            Log Out
          </Text>
        </TouchableOpacity>
        {/* </View> */}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContent}>
          {/* Timezone Toggle */}
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Clock />

            <View style={styles.greetingContainer}>
              <View style={styles.tabberContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    styles.tabButtonLeft,
                    {
                      backgroundColor: !useNewYorkTime
                        ? theme.primary
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setUseNewYorkTime(false)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color: !useNewYorkTime ? theme.buttonText : theme.text,
                      },
                    ]}
                  >
                    Local
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    styles.tabButtonRight,
                    {
                      backgroundColor: useNewYorkTime
                        ? theme.primary
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setUseNewYorkTime(true)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: useNewYorkTime ? theme.buttonText : theme.text },
                    ]}
                  >
                    NYC
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Store Management Section */}
          <View style={styles.storeTimesSection}>
            {loading ? (
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading store schedule...
              </Text>
            ) : (
              <>
                {/* Create Forms */}
                {showCreateForm === "storeTime" && renderCreateStoreTimeForm()}
                {showCreateForm === "override" && renderCreateOverrideForm()}

                {/* Regular Store Times */}
                <StoreTimesList
                  storeTimes={storeTimes}
                  onAddPress={() => setShowStoreTimeModal(true)}
                  onDeletePress={deleteStoreTime}
                  getDayName={getDayName}
                  isExpanded={isRegularHoursExpanded}
                  onToggleExpand={() =>
                    setIsRegularHoursExpanded(!isRegularHoursExpanded)
                  }
                />

                {/* Store Overrides */}
                <StoreOverridesList
                  storeOverrides={storeOverrides}
                  onAddPress={() => setShowOverrideModal(true)}
                  onDeletePress={deleteStoreOverride}
                  formatOverrideDate={formatOverrideDate}
                  isExpanded={isOverridesExpanded}
                  onToggleExpand={() =>
                    setIsOverridesExpanded(!isOverridesExpanded)
                  }
                />
              </>
            )}
          </View>

          {/* Notifications Section */}
          <NotificationsList
            notifications={scheduledNotifications}
            onAddPress={() => setIsBottomSheetVisible(true)}
            onCancelPress={handleCancelNotificationWithConfirm}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Appointment Bottom Sheet */}
      <AppointmentBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        dates={next30Days}
        selectedDate={selectedDate}
        timeSlots={timeSlots}
        selectedTimeSlot={selectedTimeSlot}
        loading={loading}
        onDatePress={handleDatePress}
        onTimeSlotPress={handleTimeSlotPress}
        onConfirmAppointment={handleConfirmAppointment}
        onClearSelection={clearSelection}
        getStoreStatus={getStoreStatus}
        isStoreClosed={isStoreClosed}
      />

      {/* Date/Time Picker */}
      {showDateTimePicker &&
        (Platform.OS === "android" ? (
          <DateTimePicker
            value={tempPickerValue}
            mode={showDateTimePicker.type}
            display="spinner"
            themeVariant="light"
            style={styles.dateTimePicker}
            onChange={handleDateTimePickerChange}
          />
        ) : (
          <View style={styles.dateTimePickerOverlay}>
            <View style={styles.dateTimePickerContainer}>
              <DateTimePicker
                value={tempPickerValue}
                mode={showDateTimePicker.type}
                display="spinner"
                themeVariant="light"
                style={styles.dateTimePicker}
                onChange={handleDateTimePickerChange}
              />
              <View style={styles.dateTimePickerActions}>
                <TouchableOpacity
                  style={[
                    styles.dateTimePickerButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setShowDateTimePicker(null)}
                >
                  <Text
                    style={[
                      styles.dateTimePickerButtonText,
                      { color: theme.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateTimePickerButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleDateTimePickerDone}
                >
                  <Text
                    style={[
                      styles.dateTimePickerButtonText,
                      { color: theme.buttonText },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

      {/* Store Time Form Modal */}
      {showStoreTimeModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            {renderCreateStoreTimeForm()}
          </View>
        </View>
      )}

      {/* Store Override Form Modal */}
      {showOverrideModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            {renderCreateOverrideForm()}
          </View>
        </View>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          {
            text: "Cancel",
            onPress: hideAlert,
            variant: "default",
          },
          {
            text: alertConfig.confirmText || "Confirm",
            onPress: () => {
              alertConfig.onConfirm();
              hideAlert();
            },
            variant: "destructive",
          },
        ]}
        onClose={hideAlert}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTime: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: 0.5,
  },
  tabberContainer: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  tabButtonLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0.5,
  },
  tabButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0.5,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  exitButton: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  greetingContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  storeTimesSection: {},
  loadingText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
  },
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
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  daySelector: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 45,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    maxWidth: "95%",
    maxHeight: "90%",
    width: "100%",
  },
  dateTimePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20000,
  },
  dateTimePickerContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 350,
    width: "90%",
  },
  dateTimePicker: {
    backgroundColor: "white",
    borderRadius: 8,
    zIndex: 3,
  },
  dateTimePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  dateTimePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  dateTimePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;
