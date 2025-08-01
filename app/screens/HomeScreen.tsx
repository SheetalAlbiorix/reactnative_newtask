import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import CustomAlert from "@/components/CustomAlert";
import Input from "@/components/Input";
import { useAuth } from "@/utils/AuthContext";
import {
  format,
  formatInTimeZone,
  fromZonedTime,
  toZonedTime,
} from "date-fns-tz";
import { addDays } from "date-fns";
import {
  getStoreTimes,
  getStoreTimesByDay,
  deleteStoreTimeByID,
  createStoreTime,
} from "@/network/api/requests/store-times";
import {
  getStoreOverrides,
  getStoreOverridesByMonthofDay,
  deleteStoreOverrideById,
  createStoreOverride,
} from "@/network/api/requests/store-override";

import DateTimePicker from "@react-native-community/datetimepicker";
import {
  scheduleNotificationAtTime,
  cancelNotification,
  saveScheduledNotification,
  getScheduledNotifications,
  removeScheduledNotification,
  ScheduledNotification,
} from "@/utils/NotificationsAlert";

// Import the interface, or define it locally if not exported

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

interface StoreTimesResponse {
  id: string;
  day_of_week: number;
  end_time: string;
  is_open: boolean;
  start_time: string;
}

interface StoreOverrideResponse {
  id: string;
  day: number;
  month: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

const HomeScreen = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();

  // Timezone state - true for New York, false for local
  const [useNewYorkTime, setUseNewYorkTime] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DateItem | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [storeTimes, setStoreTimes] = useState<StoreTimesResponse[]>([]);
  const [storeOverrides, setStoreOverrides] = useState<StoreOverrideResponse[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
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
  const [scheduledNotifications, setScheduledNotifications] = useState<
    ScheduledNotification[]
  >([]);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    body: "",
    scheduledDate: new Date(),
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
      // scheduleNotification("Hello!!", "Welcome to App");
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    fetchAllStoreTimes();
    fetchAllStoreOverrides();
    loadScheduledNotifications();
  }, []);

  // Regenerate time slots when data changes
  useEffect(() => {
    if (selectedDate && storeTimes.length > 0) {
      const slots = generateTimeSlots(selectedDate, storeTimes, storeOverrides);
      setTimeSlots(slots);
    }
  }, [selectedDate, storeTimes, storeOverrides]);

  const fetchAllStoreTimes = async () => {
    try {
      setLoading(true);
      const times = await getStoreTimes();
      setStoreTimes(times);
      console.log("All Store Times:", times);
    } catch (error) {
      console.error("Error fetching all store times:", error);
      setStoreTimes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStoreOverrides = async () => {
    try {
      const overrides = await getStoreOverrides();
      setStoreOverrides(overrides);
    } catch (error) {
      console.error("Error fetching store overrides:", error);
      setStoreOverrides([]);
    }
  };

  const loadScheduledNotifications = () => {
    const notifications = getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  const handleScheduleNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.body.trim()) {
      alert("Please enter both title and body for the notification");
      return;
    }

    try {
      setLoading(true);
      const notificationId = await scheduleNotificationAtTime(
        notificationForm.title,
        notificationForm.body,
        notificationForm.scheduledDate
      );

      if (notificationId) {
        const newNotification: ScheduledNotification = {
          id: Date.now().toString(),
          title: notificationForm.title,
          body: notificationForm.body,
          scheduledDate: notificationForm.scheduledDate
            .toISOString()
            .split("T")[0],
          scheduledTime: notificationForm.scheduledDate
            .toTimeString()
            .slice(0, 5),
          notificationId: notificationId,
          createdAt: new Date().toISOString(),
        };

        saveScheduledNotification(newNotification);
        loadScheduledNotifications();

        // Reset form
        setNotificationForm({
          title: "",
          body: "",
          scheduledDate: new Date(),
        });
        setShowNotificationForm(false);

        alert("Notification scheduled successfully!");
      }
    } catch (error) {
      console.error("Error scheduling notification:", error);
      alert("Failed to schedule notification");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNotification = async (
    notification: ScheduledNotification
  ) => {
    try {
      setLoading(true);
      const success = await cancelNotification(notification.notificationId);

      if (success) {
        removeScheduledNotification(notification.id);
        loadScheduledNotifications();
        alert("Notification cancelled successfully!");
      } else {
        alert("Failed to cancel notification");
      }
    } catch (error) {
      console.error("Error cancelling notification:", error);
      alert("Failed to cancel notification");
    } finally {
      setLoading(false);
    }
  };

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

  const deleteStoreTime = async (storeTimeId: string) => {
    try {
      setLoading(true);
      await deleteStoreTimeByID(storeTimeId);
      console.log("Store time deleted successfully:", storeTimeId);

      // Refresh the store times list after deletion
      await fetchAllStoreTimes();

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          storeTimes.filter((st) => st.id !== storeTimeId), // Use filtered array immediately
          storeOverrides
        );
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error deleting store time:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStoreOverride = async (storeOverrideId: string) => {
    try {
      setLoading(true);
      await deleteStoreOverrideById({ id: storeOverrideId });
      console.log("Store override deleted successfully:", storeOverrideId);

      // Refresh the store overrides list after deletion
      await fetchAllStoreOverrides();

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          storeTimes,
          storeOverrides.filter((so) => so.id !== storeOverrideId)
        );
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error deleting store override:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewStoreTime = async () => {
    try {
      setLoading(true);

      // Check if store time already exists for this day
      const existingStoreTime = storeTimes.find(
        (st) => st.day_of_week === newStoreTime.day_of_week
      );
      if (existingStoreTime) {
        alert(
          `Store time for ${getDayName(
            newStoreTime.day_of_week
          )} already exists. Please delete the existing one first.`
        );
        return;
      }

      const createdStoreTime = await createStoreTime(newStoreTime);
      console.log("Store time created successfully:", createdStoreTime);

      // Refresh the store times list
      await fetchAllStoreTimes();

      // Reset form and close
      setNewStoreTime({
        day_of_week: 0,
        start_time: "09:00",
        end_time: "17:00",
        is_open: true,
      });
      setShowStoreTimeModal(false);

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          [...storeTimes, createdStoreTime],
          storeOverrides
        );
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error creating store time:", error);
      alert("Error creating store time. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createNewOverride = async () => {
    try {
      setLoading(true);

      // Check if override already exists for this date
      const existingOverride = storeOverrides.find(
        (so) => so.month === newOverride.month && so.day === newOverride.day
      );
      if (existingOverride) {
        alert(
          `Override for ${formatOverrideDate(
            newOverride.month,
            newOverride.day
          )} already exists. Please delete the existing one first.`
        );
        return;
      }

      const createdOverride = await createStoreOverride(newOverride);
      console.log("Store override created successfully:", createdOverride);

      // Refresh the store overrides list
      await fetchAllStoreOverrides();

      // Reset form and close
      setNewOverride({
        day: 1,
        month: 1,
        start_time: "09:00",
        end_time: "17:00",
        is_open: true,
      });
      setShowOverrideModal(false);

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(selectedDate, storeTimes, [
          ...storeOverrides,
          createdOverride,
        ]);
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error creating store override:", error);
      alert("Error creating store override. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreTimes = async (dayOfWeek: number) => {
    try {
      setLoading(true);
      const times = await getStoreTimesByDay({ day: dayOfWeek });
      setStoreTimes(times);
      console.log("Store Times for day", dayOfWeek, ":", times);
    } catch (error) {
      console.error("Error fetching store times:", error);
      setStoreTimes([]);
    } finally {
      setLoading(false);
    }
  };

  // Check store availability considering both regular times and overrides
  const getStoreAvailabilityForDate = (
    date: Date,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[]
  ) => {
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1; // getMonth() returns 0-11, API expects 1-12
    const day = date.getDate();

    // First check for store overrides (holidays, special days)
    const override = allStoreOverrides.find(
      (override) => override.month === month && override.day === day
    );

    if (override) {
      // Override found - use override settings
      return {
        isOpen: override.is_open,
        hours: override.is_open
          ? [{ start_time: override.start_time, end_time: override.end_time }]
          : [],
        isOverride: true,
      };
    }

    // No override - use regular store times
    const dayStoreTimes = allStoreTimes.filter(
      (st) => st.day_of_week === dayOfWeek && st.is_open
    );

    return {
      isOpen: dayStoreTimes.length > 0,
      hours: dayStoreTimes.map((st) => ({
        start_time: st.start_time,
        end_time: st.end_time,
      })),
      isOverride: false,
    };
  };

  // Generate 15-minute time slots for all 24 hours (always in NYC timezone)
  const generateTimeSlots = (
    date: DateItem,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[]
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    // Get store availability for this date
    const storeAvailability = getStoreAvailabilityForDate(
      date.date,
      allStoreTimes,
      allStoreOverrides
    );

    // If store is closed, return empty array
    if (!storeAvailability.isOpen || storeAvailability.hours.length === 0) {
      return slots;
    }

    // Generate 15-minute intervals for all 24 hours (00:00 to 23:45) in NYC time
    let slotId = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        // Check if this time slot falls within any of the store hours
        const currentTimeInMinutes = hour * 60 + minute;
        let isAvailable = false;

        // Check against all store hours for this day (store hours are in NYC time)
        for (const storeHour of storeAvailability.hours) {
          const [storeStartHour, storeStartMinute] = storeHour.start_time
            .split(":")
            .map(Number);
          const [storeEndHour, storeEndMinute] = storeHour.end_time
            .split(":")
            .map(Number);

          const storeStartInMinutes = storeStartHour * 60 + storeStartMinute;
          const storeEndInMinutes = storeEndHour * 60 + storeEndMinute;

          // Handle case where store hours cross midnight (e.g., 22:00 to 06:00)
          if (storeEndInMinutes < storeStartInMinutes) {
            if (
              currentTimeInMinutes >= storeStartInMinutes ||
              currentTimeInMinutes < storeEndInMinutes
            ) {
              isAvailable = true;
              break;
            }
          } else {
            if (
              currentTimeInMinutes >= storeStartInMinutes &&
              currentTimeInMinutes < storeEndInMinutes
            ) {
              isAvailable = true;
              break;
            }
          }
        }

        slots.push({
          id: `slot-${slotId}`,
          time: timeString,
          hour: hour,
          minute: minute,
          isAvailable: isAvailable,
        });

        slotId++;
      }
    }

    return slots;
  };

  // Check if store is closed for a given date
  const isStoreClosed = (
    date: DateItem,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[]
  ): boolean => {
    const storeAvailability = getStoreAvailabilityForDate(
      date.date,
      allStoreTimes,
      allStoreOverrides
    );
    return !storeAvailability.isOpen;
  };

  const handleDatePress = async (dateItem: DateItem) => {
    setSelectedDate(dateItem);

    // Clear selected time slot when changing dates
    setSelectedTimeSlot(null);

    // Generate time slots for the selected date using current data
    const slots = generateTimeSlots(dateItem, storeTimes, storeOverrides);
    setTimeSlots(slots);
  };

  const handleTimeSlotPress = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    console.log(
      "Selected time slot:",
      timeSlot.time,
      "on",
      selectedDate?.formattedDate
    );
  };

  // Get formatted time based on selected timezone
  const getFormattedTime = () => {
    if (useNewYorkTime) {
      return formatInTimeZone(currentTime, "America/New_York", "PPpp");
    } else {
      // Use local timezone
      return format(currentTime, "PPpp");
    }
  };

  const toggleTimezone = () => {
    setUseNewYorkTime(!useNewYorkTime);
  };

  // Get greeting message based on time of day
  const getGreeting = () => {
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const nycDate = new Date(nycTime);
    const hour = nycDate.getHours();

    if (hour >= 5 && hour <= 9) {
      return "Good Morning";
    } else if (hour >= 10 && hour <= 11) {
      return "Late Morning Vibes!";
    } else if (hour >= 12 && hour <= 16) {
      return "Good Afternoon";
    } else if (hour >= 17 && hour <= 20) {
      return "Good Evening";
    } else {
      return "Night Owl";
    }
  };

  // Get local city name from timezone
  const getLocalCity = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = timezone.split("/");
      if (parts.length > 1) {
        // Convert timezone format like "America/New_York" to "New York"
        return parts[parts.length - 1].replace(/_/g, " ");
      }
      return timezone;
    } catch (error) {
      return "Local";
    }
  };

  // Get greeting message with city and timezone indicator
  const getGreetingMessage = () => {
    const greeting = getGreeting();
    const city = useNewYorkTime ? "NYC" : getLocalCity();
    const timezoneIndicator = useNewYorkTime ? " (NYC Time)" : " (Local Time)";

    // Special case for "Night Owl" to match the table format
    if (greeting === "Night Owl") {
      return `${greeting} in ${city}!`;
    }

    return `${greeting}, ${city}!`;
  };

  // Get store status for a date (for display purposes)
  const getStoreStatus = (date: DateItem) => {
    const storeAvailability = getStoreAvailabilityForDate(
      date.date,
      storeTimes,
      storeOverrides
    );
    return {
      isOpen: storeAvailability.isOpen,
      isOverride: storeAvailability.isOverride,
      statusText: storeAvailability.isOverride
        ? storeAvailability.isOpen
          ? "Special Hours"
          : "Holiday/Closed"
        : storeAvailability.isOpen
        ? "Open"
        : "Closed",
    };
  };

  // Get day name from day number (0=Sunday, 1=Monday, etc.)
  const getDayName = (dayOfWeek: number): string => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek] || "Unknown";
  };

  // Get month name from month number (1=January, 2=February, etc.)
  const getMonthName = (month: number): string => {
    const months = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month] || "Unknown";
  };

  // Format date for store override display
  const formatOverrideDate = (month: number, day: number): string => {
    const monthName = getMonthName(month);
    return `${monthName} ${day}`;
  };

  // Handle date/time picker change
  const handleDateTimePickerChange = (event: any, selectedValue?: Date) => {
    if (!showDateTimePicker || !selectedValue) {
      setShowDateTimePicker(null);
      return;
    }

    const { type, field, formType } = showDateTimePicker;

    if (formType === "storeTime") {
      if (type === "time") {
        const timeString = selectedValue.toTimeString().slice(0, 5); // HH:MM format
        setNewStoreTime((prev) => ({
          ...prev,
          [field]: timeString,
        }));
      }
    } else if (formType === "override") {
      if (type === "time") {
        const timeString = selectedValue.toTimeString().slice(0, 5); // HH:MM format
        setNewOverride((prev) => ({
          ...prev,
          [field]: timeString,
        }));
      } else if (type === "date") {
        if (field === "month") {
          setNewOverride((prev) => ({
            ...prev,
            month: selectedValue.getMonth() + 1, // getMonth() returns 0-11, we need 1-12
            day: Math.min(
              prev.day,
              new Date(
                selectedValue.getFullYear(),
                selectedValue.getMonth() + 1,
                0
              ).getDate()
            ), // Ensure day is valid for the month
          }));
        } else if (field === "day") {
          setNewOverride((prev) => ({
            ...prev,
            day: selectedValue.getDate(),
          }));
        }
      }
    } else if (formType === "notification") {
      if (field === "scheduledDate") {
        setNotificationForm((prev) => ({
          ...prev,
          scheduledDate: selectedValue,
        }));
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
          date.setMonth(newOverride.month - 1); // setMonth expects 0-11
          date.setDate(1); // Set to first day of month for month picker
        } else if (field === "day") {
          date.setMonth(newOverride.month - 1);
          date.setDate(newOverride.day);
        }
        return date;
      }
    } else if (formType === "notification" && field === "scheduledDate") {
      return notificationForm.scheduledDate;
    }

    return new Date();
  }; // Generate the next 30 days
  const next30Days = useMemo((): DateItem[] => {
    const today = new Date();
    const dates: DateItem[] = [];

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      dates.push({
        id: i.toString(),
        date: date,
        formattedDate: format(date, "EEEE, MMMM d, yyyy"),
        shortDate: format(date, "MMM d"),
        dayName: format(date, "EEEE"),
        isToday: i === 0,
      });
    }

    return dates;
  }, []);

  const renderDateItem = ({ item }: { item: DateItem }) => {
    const storeStatus = getStoreStatus(item);
    const isSelected = selectedDate?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
            shadowColor: isSelected ? theme.primary : theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: isSelected ? 6 : 2,
          },
        ]}
        onPress={() => handleDatePress(item)}
        activeOpacity={0.7}
      >
        {/* Header with day name and status indicator */}
        <View style={styles.dateItemHeader}>
          <Text
            style={[
              styles.dayName,
              {
                color: isSelected
                  ? theme.buttonText
                  : item.isToday
                  ? theme.primary
                  : theme.text,
              },
            ]}
          >
            {item.dayName.substring(0, 3)}
          </Text>
          <View
            style={[
              styles.storeStatusDot,
              {
                backgroundColor: storeStatus.isOpen ? "#22C55E" : "#EF4444",
                borderWidth: 1,
                borderColor: isSelected ? theme.buttonText : "transparent",
              },
            ]}
          />
        </View>

        {/* Date number */}
        <Text
          style={[
            styles.dateText,
            {
              color: isSelected
                ? theme.buttonText
                : item.isToday
                ? theme.primary
                : theme.text,
              fontSize: 18,
              fontWeight: isSelected ? "700" : "600",
            },
          ]}
        >
          {item.shortDate.split(" ")[1]}
        </Text>

        {/* Month */}
        <Text
          style={[
            styles.dateMonth,
            {
              color: isSelected
                ? theme.buttonText
                : item.isToday
                ? theme.primary
                : theme.textSecondary,
            },
          ]}
        >
          {item.shortDate.split(" ")[0]}
        </Text>

        {/* Today label */}
        {item.isToday && !isSelected && (
          <View style={[styles.todayBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.todayLabel, { color: theme.buttonText }]}>
              TODAY
            </Text>
          </View>
        )}

        {/* Store status */}
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.storeStatusText,
              {
                color: isSelected
                  ? theme.buttonText
                  : storeStatus.isOpen
                  ? "#22C55E"
                  : "#EF4444",
                fontWeight: "600",
              },
            ]}
          >
            {storeStatus.isOpen ? "Open" : "Closed"}
          </Text>
          {storeStatus.isOverride && (
            <Text
              style={[
                styles.overrideText,
                {
                  color: isSelected ? theme.buttonText : theme.textSecondary,
                },
              ]}
            >
              {storeStatus.isOpen ? "Special" : "Holiday"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => (
    <TouchableOpacity
      style={[
        styles.timeSlot,
        {
          backgroundColor:
            selectedTimeSlot?.id === item.id ? theme.primary : theme.surface,
          borderColor:
            selectedTimeSlot?.id === item.id ? theme.primary : theme.border,
        },
      ]}
      disabled={!item.isAvailable}
      onPress={() => item.isAvailable && handleTimeSlotPress(item)}
    >
      <View style={styles.timeSlotContent}>
        <Text
          style={[
            styles.timeSlotText,
            {
              color:
                selectedTimeSlot?.id === item.id
                  ? theme.buttonText
                  : item.isAvailable
                  ? theme.text
                  : theme.textSecondary,
            },
          ]}
        >
          {item.time}
        </Text>
        <View
          style={[
            styles.availabilityDot,
            {
              backgroundColor: item.isAvailable ? "#22C55E" : "#EF4444", // Green for available, red for unavailable
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const renderStoreTimeItem = ({ item }: { item: StoreTimesResponse }) => (
    <View
      style={[
        styles.horizontalStoreTimeItem,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          showConfirmationAlert(
            "Delete Store Hours",
            `Are you sure you want to delete the ${getDayName(
              item.day_of_week
            )} store hours?`,
            () => deleteStoreTime(item.id),
            "Delete"
          )
        }
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
      <View style={styles.storeTimeInfo}>
        <View style={styles.storeTimeHeader}>
          <Text style={[styles.storeTimeDayText, { color: theme.text }]}>
            {getDayName(item.day_of_week)}
          </Text>
          <View
            style={[
              styles.storeTimeStatusDot,
              { backgroundColor: item.is_open ? "#22C55E" : "#EF4444" },
            ]}
          />
        </View>
        <Text style={[styles.storeTimeHours, { color: theme.textSecondary }]}>
          {item.is_open ? `${item.start_time} - ${item.end_time}` : "Closed"}
        </Text>
      </View>
    </View>
  );

  const renderStoreOverrideItem = ({
    item,
  }: {
    item: StoreOverrideResponse;
  }) => (
    <View
      style={[
        styles.horizontalStoreOverrideItem,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          showConfirmationAlert(
            "Delete Override",
            `Are you sure you want to delete the ${formatOverrideDate(
              item.month,
              item.day
            )} override?`,
            () => deleteStoreOverride(item.id),
            "Delete"
          )
        }
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
      <View style={styles.storeTimeInfo}>
        <View style={styles.storeTimeHeader}>
          <Text style={[styles.storeOverrideDateText, { color: theme.text }]}>
            {formatOverrideDate(item.month, item.day)}
          </Text>
        </View>
        <View style={styles.storeTimeHeader}>
          <Text style={[styles.storeTimeHours, { color: theme.textSecondary }]}>
            {item.is_open ? `${item.start_time} - ${item.end_time}` : "Closed"}
          </Text>
          <View
            style={[
              styles.storeTimeStatusDot,
              {
                backgroundColor: item.is_open ? "#22C55E" : "#EF4444",
                marginLeft: 8,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );

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
                  {getDayName(day).substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Open/Closed Toggle */}
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

        {/* Time Fields (only if open) */}
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

        {/* Open/Closed Toggle */}
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

        {/* Time Fields (only if open) */}
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
            style={{ flex: 1, backgroundColor: "#F59E0B" }}
          >
            {loading ? "Creating..." : "Create Override"}
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <Screen useSafeArea>
      {/* Header with Time, Timezone Tabber, Plus Button and Exit Button */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            {getGreetingMessage()}
          </Text>
          <Text style={[styles.headerTime, { color: theme.textSecondary }]}>
            {getFormattedTime()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: "#EF4444" }]}
            onPress={() =>
              showConfirmationAlert(
                "Log Out",
                "Are you sure you want to log out?",
                logout,
                "Log Out"
              )
            }
          >
            <Text style={[styles.exitButtonText, { color: "white" }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContent}>
          {/* Greeting Message */}
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
                    {
                      color: useNewYorkTime ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  NYC
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Times and Overrides */}
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
                {(storeTimes.length > 0 || !isRegularHoursExpanded) && (
                  <View style={styles.subsection}>
                    <TouchableOpacity
                      style={styles.collapsibleHeader}
                      onPress={() =>
                        setIsRegularHoursExpanded(!isRegularHoursExpanded)
                      }
                    >
                      <View style={styles.subsectionHeader}>
                        <Text
                          style={[
                            styles.subsectionTitle,
                            { color: theme.text },
                          ]}
                        >
                          Regular Hours ({storeTimes.length})
                        </Text>
                        <View style={styles.headerActions}>
                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              { backgroundColor: theme.primary },
                            ]}
                            onPress={() => setShowStoreTimeModal(true)}
                          >
                            <Text
                              style={[
                                styles.addButtonText,
                                { color: theme.buttonText },
                              ]}
                            >
                              + Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {isRegularHoursExpanded && storeTimes.length > 0 && (
                      <FlatList
                        data={storeTimes}
                        renderItem={renderStoreTimeItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.horizontalList}
                        contentContainerStyle={styles.horizontalListContent}
                      />
                    )}
                  </View>
                )}

                {/* Store Overrides */}
                {(storeOverrides.length > 0 || !isOverridesExpanded) && (
                  <View style={styles.subsection}>
                    <TouchableOpacity
                      style={styles.collapsibleHeader}
                      onPress={() =>
                        setIsOverridesExpanded(!isOverridesExpanded)
                      }
                    >
                      <View style={styles.subsectionHeader}>
                        <Text
                          style={[
                            styles.subsectionTitle,
                            { color: theme.text },
                          ]}
                        >
                          Special Days & Holidays ({storeOverrides.length})
                        </Text>
                        <View style={styles.headerActions}>
                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              { backgroundColor: "#F59E0B" },
                            ]}
                            onPress={() => setShowOverrideModal(true)}
                          >
                            <Text
                              style={[styles.addButtonText, { color: "white" }]}
                            >
                              + Override
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {isOverridesExpanded && storeOverrides.length > 0 && (
                      <FlatList
                        data={storeOverrides}
                        renderItem={renderStoreOverrideItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.horizontalList}
                        contentContainerStyle={styles.horizontalListContent}
                      />
                    )}
                  </View>
                )}

                {/* Empty State with Add Buttons */}
                {storeTimes.length === 0 &&
                  storeOverrides.length === 0 &&
                  !showCreateForm && (
                    <View style={styles.emptyStateContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        No store schedule available
                      </Text>
                      <View style={styles.emptyStateActions}>
                        <TouchableOpacity
                          style={[
                            styles.emptyStateButton,
                            { backgroundColor: theme.primary },
                          ]}
                          onPress={() => setShowCreateForm("storeTime")}
                        >
                          <Text
                            style={[
                              styles.emptyStateButtonText,
                              { color: theme.buttonText },
                            ]}
                          >
                            Add Store Hours
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.emptyStateButton,
                            { backgroundColor: "#F59E0B" },
                          ]}
                          onPress={() => setShowCreateForm("override")}
                        >
                          <Text
                            style={[
                              styles.emptyStateButtonText,
                              { color: "white" },
                            ]}
                          >
                            Add Override
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                {/* Add buttons when lists exist but no form is shown */}
                {(storeTimes.length > 0 || storeOverrides.length > 0) &&
                  !showCreateForm && (
                    <View style={styles.addActionsContainer}>
                      {storeTimes.length === 0 && (
                        <TouchableOpacity
                          style={[
                            styles.addActionButton,
                            { backgroundColor: theme.primary },
                          ]}
                          onPress={() => setShowCreateForm("storeTime")}
                        >
                          <Text
                            style={[
                              styles.addActionButtonText,
                              { color: theme.buttonText },
                            ]}
                          >
                            + Add Regular Hours
                          </Text>
                        </TouchableOpacity>
                      )}
                      {storeOverrides.length === 0 && (
                        <TouchableOpacity
                          style={[
                            styles.addActionButton,
                            { backgroundColor: "#F59E0B" },
                          ]}
                          onPress={() => setShowCreateForm("override")}
                        >
                          <Text
                            style={[
                              styles.addActionButtonText,
                              { color: "white" },
                            ]}
                          >
                            + Add Special Day
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
              </>
            )}
          </View>

          {/* Scheduled Notifications Section */}
          <View style={styles.notificationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Scheduled Appointments
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => setIsBottomSheetVisible(true)}
                disabled={loading}
              >
                <Text
                  style={[styles.addButtonText, { color: theme.buttonText }]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>

            {scheduledNotifications.length > 0 ? (
              <FlatList
                data={scheduledNotifications}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.notificationItem,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.notificationInfo}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: theme.text },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationBody,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.body}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.cancelNotificationButton,
                        { backgroundColor: "#EF4444" },
                      ]}
                      onPress={() =>
                        showConfirmationAlert(
                          "Cancel Notification",
                          "Are you sure you want to cancel this scheduled notification?",
                          () => handleCancelNotification(item),
                          "Delete"
                        )
                      }
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.cancelNotificationButtonText,
                          { color: "white" },
                        ]}
                      >
                        {loading ? "..." : "Remove"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyNotificationsContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No scheduled notifications
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={isBottomSheetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsBottomSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setIsBottomSheetVisible(false)}
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
                onPress={() => setIsBottomSheetVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSheetContent}>
              {/* Next 30 Days List in Bottom Sheet */}
              <View style={styles.bottomSheetDatesSection}>
                <Text
                  style={[
                    styles.bottomSheetSectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Select Date
                </Text>
                <FlatList
                  data={next30Days}
                  renderItem={renderDateItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.datesList}
                />
              </View>

              {/* Time Slots in Bottom Sheet */}
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
                  {loading ? (
                    <Text
                      style={[
                        styles.loadingText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Loading time slots...
                    </Text>
                  ) : isStoreClosed(
                      selectedDate,
                      storeTimes,
                      storeOverrides
                    ) ? (
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
                  ) : timeSlots.length > 0 ? (
                    <FlatList
                      data={timeSlots}
                      renderItem={renderTimeSlot}
                      keyExtractor={(item) => item.id}
                      numColumns={4}
                      contentContainerStyle={styles.timeSlotsGrid}
                      style={styles.timeSlotsContainer}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.loadingText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      No time slots available
                    </Text>
                  )}
                </View>
              )}

              {/* Selected Appointment in Bottom Sheet */}
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
                      onPress={() => {
                        setSelectedTimeSlot(null);
                        setSelectedDate(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.compactButtonText,
                          { color: theme.text },
                        ]}
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
                      onPress={async () => {
                        if (selectedDate && selectedTimeSlot) {
                          // Create appointment date in NYC timezone
                          const [hours, minutes] = selectedTimeSlot.time
                            .split(":")
                            .map(Number);

                          // Create a date object for the appointment in NYC time
                          const appointmentDateNYC = new Date(
                            selectedDate.date
                          );
                          appointmentDateNYC.setHours(hours, minutes, 0, 0);

                          // Convert NYC time to local timezone using date-fns-tz
                          const nycTimeZone = "America/New_York";
                          const localTimeZone =
                            Intl.DateTimeFormat().resolvedOptions().timeZone;

                          // This represents the same moment in time but in the local timezone
                          const appointmentInLocal = fromZonedTime(
                            appointmentDateNYC,
                            nycTimeZone
                          );

                          // Schedule notification 15 minutes before appointment (in local time)
                          const notificationTime = new Date(
                            appointmentInLocal.getTime() - 15 * 60 * 1000
                          );

                          // Format local time for display
                          const localTimeString = format(
                            appointmentInLocal,
                            "HH:mm"
                          );

                          if (notificationTime > new Date()) {
                            const notificationId =
                              await scheduleNotificationAtTime(
                                "Appointment Reminder",
                                `You have an appointment scheduled at ${selectedTimeSlot.time} NYC time (${localTimeString} local time) on ${selectedDate.formattedDate}`,
                                notificationTime
                              );

                            if (notificationId) {
                              const newNotification: ScheduledNotification = {
                                id: Date.now().toString(),
                                title: "Appointment Reminder",
                                body: `You have an appointment scheduled at ${selectedTimeSlot.time} NYC time (${localTimeString} local time) on ${selectedDate.formattedDate}`,
                                scheduledDate: notificationTime
                                  .toISOString()
                                  .split("T")[0],
                                scheduledTime: notificationTime
                                  .toTimeString()
                                  .slice(0, 5),
                                notificationId: notificationId,
                                createdAt: new Date().toISOString(),
                              };

                              saveScheduledNotification(newNotification);
                              loadScheduledNotifications();
                            }
                          }

                          console.log("Confirming appointment:", {
                            date: selectedDate.formattedDate,
                            nycTime: selectedTimeSlot.time,
                            localTime: localTimeString,
                          });
                          setIsBottomSheetVisible(false);
                          alert(
                            `Appointment confirmed!\nNYC Time: ${selectedTimeSlot.time}\nLocal Time: ${localTimeString}\nNotification scheduled for 15 minutes before.`
                          );
                        }
                      }}
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

      {/* Date/Time Picker */}
      {showDateTimePicker && (
        <View style={styles.dateTimePickerOverlay}>
          <View style={styles.dateTimePickerContainer}>
            <DateTimePicker
              value={getPickerValue()}
              mode={
                showDateTimePicker.formType === "notification"
                  ? "datetime"
                  : showDateTimePicker.type
              }
              display="spinner"
              themeVariant="light"
              style={styles.dateTimePicker}
              onChange={handleDateTimePickerChange}
            />
            <View style={styles.dateTimePickerActions}>
              <TouchableOpacity
                style={[
                  styles.dateTimePickerButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
                onPress={() => setShowDateTimePicker(null)}
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
      )}

      {/* Store Time Form */}
      {showStoreTimeModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            {renderCreateStoreTimeForm()}
          </View>
        </View>
      )}

      {/* Store Override Form */}
      {showOverrideModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            {renderCreateOverrideForm()}
          </View>
        </View>
      )}

      {/* Custom Alert Component */}
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
    fontSize: 11,
    fontWeight: "600",
  },
  exitButton: {
    borderRadius: 16,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  horizontalList: {},
  horizontalListContent: {
    paddingHorizontal: 16,
  },
  horizontalStoreTimeItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  horizontalStoreOverrideItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 200,
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  deleteButtonText: {
    color: "grey",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 16,
  },
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
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    maxWidth: "95%",
    maxHeight: "90%",
    width: "100%",
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
    // padding: 16,
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
  datesList: {
    paddingHorizontal: 16,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 85,
    maxWidth: 110,
    position: "relative",
  },
  dateItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  storeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeStatusText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  todayBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#22C55E",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  todayLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusContainer: {
    marginTop: 4,
    alignItems: "center",
  },
  overrideText: {
    fontSize: 8,
    fontWeight: "400",
    marginTop: 1,
    textAlign: "center",
  },
  timeSlotsGrid: {
    paddingHorizontal: 16,
  },
  timeSlotsContainer: {
    maxHeight: 300,
  },
  timeSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    margin: 4,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
  },
  timeSlotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
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
  greetingContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: 0.5,
  },
  storeTimesSection: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  storeTimeInfo: {
    flex: 1,
  },
  storeTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  storeTimeDayText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  storeTimeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeTimeHours: {
    fontSize: 14,
    fontWeight: "400",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 0.3,
  },
  storeOverrideDateText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addActionsContainer: {
    marginTop: 16,
    gap: 8,
  },
  addActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  createFormContainer: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  // Notification Styles
  notificationsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontStyle: "italic",
  },
  cancelNotificationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  cancelNotificationButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyNotificationsContainer: {
    alignItems: "center",
    paddingVertical: 32,
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
    zIndex: 10000,
    elevation: 10000,
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
