import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { useAuth } from "@/utils/AuthContext";
import { format, formatInTimeZone } from "date-fns-tz";
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
import Color from "@/utils/Color";
import { Ionicons } from "@expo/vector-icons";

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
  const [showDateTimePicker, setShowDateTimePicker] = useState<{
    type: "time" | "date";
    field: "start_time" | "end_time" | "month" | "day";
    formType: "storeTime" | "override";
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
  }, []);

  // Regenerate time slots when timezone changes
  useEffect(() => {
    if (selectedDate && storeTimes.length > 0) {
      const slots = generateTimeSlots(
        selectedDate,
        storeTimes,
        storeOverrides,
        useNewYorkTime
      );
      setTimeSlots(slots);
    }
  }, [useNewYorkTime, selectedDate, storeTimes, storeOverrides]);

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
      console.log("All Store Overrides:", overrides);
    } catch (error) {
      console.error("Error fetching store overrides:", error);
      setStoreOverrides([]);
    }
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
          storeOverrides,
          useNewYorkTime
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
          storeOverrides.filter((so) => so.id !== storeOverrideId),
          useNewYorkTime
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
      setShowCreateForm(null);

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          [...storeTimes, createdStoreTime],
          storeOverrides,
          useNewYorkTime
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

  const confirmLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => logout(),
        },
      ],
      { cancelable: true }
    );
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
      setShowCreateForm(null);

      // If we have a selected date, regenerate time slots
      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          storeTimes,
          [...storeOverrides, createdOverride],
          useNewYorkTime
        );
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

  // Generate 15-minute time slots for all 24 hours
  const generateTimeSlots = (
    date: DateItem,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[],
    useNYCTimezone: boolean = useNewYorkTime
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

    // Generate 15-minute intervals for all 24 hours (00:00 to 23:45)
    let slotId = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        // Check if this time slot falls within any of the store hours
        const currentTimeInMinutes = hour * 60 + minute;
        let isAvailable = false;

        // Check against all store hours for this day
        for (const storeHour of storeAvailability.hours) {
          let storeStartHour = 0;
          let storeStartMinute = 0;
          let storeEndHour = 0;
          let storeEndMinute = 0;

          // Parse start and end times
          [storeStartHour, storeStartMinute] = storeHour.start_time
            .split(":")
            .map(Number);
          [storeEndHour, storeEndMinute] = storeHour.end_time
            .split(":")
            .map(Number);

          // Convert store hours to local timezone if needed
          let adjustedStoreStartHour = storeStartHour;
          let adjustedStoreStartMinute = storeStartMinute;
          let adjustedStoreEndHour = storeEndHour;
          let adjustedStoreEndMinute = storeEndMinute;

          if (!useNYCTimezone) {
            // Calculate timezone offset between local time and NYC time
            const now = new Date();
            const localTime = new Date(now.getTime());
            const nycTime = new Date(
              now.toLocaleString("en-US", { timeZone: "America/New_York" })
            );
            const offsetHours = Math.round(
              (localTime.getTime() - nycTime.getTime()) / (1000 * 60 * 60)
            );

            // Adjust store hours to local timezone
            adjustedStoreStartHour = (storeStartHour + offsetHours + 24) % 24;
            adjustedStoreEndHour = (storeEndHour + offsetHours + 24) % 24;
          }

          const storeStartInMinutes =
            adjustedStoreStartHour * 60 + adjustedStoreStartMinute;
          const storeEndInMinutes =
            adjustedStoreEndHour * 60 + adjustedStoreEndMinute;

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
    const slots = generateTimeSlots(
      dateItem,
      storeTimes,
      storeOverrides,
      useNewYorkTime
    );
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
    }

    setShowDateTimePicker(null);
  };

  // Show date/time picker
  const showPicker = (
    type: "time" | "date",
    field: "start_time" | "end_time" | "month" | "day",
    formType: "storeTime" | "override"
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
        styles.storeTimeItem,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
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
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: "#EF4444" }]}
        onPress={() => deleteStoreTime(item.id)}
        disabled={loading}
      >
        <Text style={[styles.deleteButtonText, { color: "white" }]}>
          {loading ? "..." : "×"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStoreOverrideItem = ({
    item,
  }: {
    item: StoreOverrideResponse;
  }) => (
    <View
      style={[
        styles.storeOverrideItem,
        { backgroundColor: theme.surface, borderColor: "#F59E0B" },
      ]}
    >
      <View style={styles.storeTimeInfo}>
        <View style={styles.storeTimeHeader}>
          <Text style={[styles.storeOverrideDateText, { color: theme.text }]}>
            {formatOverrideDate(item.month, item.day)}
          </Text>
          <View style={[styles.overrideBadge, { backgroundColor: "#F59E0B" }]}>
            <Text style={[styles.overrideBadgeText, { color: "white" }]}>
              OVERRIDE
            </Text>
          </View>
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
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: "#EF4444" }]}
        onPress={() => deleteStoreOverride(item.id)}
        disabled={loading}
      >
        <Text style={[styles.deleteButtonText, { color: "white" }]}>
          {loading ? "..." : "×"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateStoreTimeForm = () => (
    <View
      style={[
        styles.createFormContainer,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.createFormHeader}>
        <Text style={[styles.createFormTitle, { color: theme.text }]}>
          Add Regular Store Hours
        </Text>
        <TouchableOpacity
          style={[styles.closeFormButton, { backgroundColor: theme.surface }]}
          onPress={() => setShowCreateForm(null)}
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
                    borderColor: theme.border,
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
                  borderColor: theme.border,
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
                  borderColor: theme.border,
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
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Start Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => showPicker("time", "start_time", "storeTime")}
              >
                <Text style={[styles.timeInputText, { color: theme.text }]}>
                  {newStoreTime.start_time}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                End Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => showPicker("time", "end_time", "storeTime")}
              >
                <Text style={[styles.timeInputText, { color: theme.text }]}>
                  {newStoreTime.end_time}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowCreateForm(null)}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.primary }]}
            onPress={createNewStoreTime}
            disabled={loading}
          >
            <Text
              style={[styles.createButtonText, { color: theme.buttonText }]}
            >
              {loading ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCreateOverrideForm = () => (
    <View
      style={[
        styles.createFormContainer,
        { backgroundColor: theme.card, borderColor: "#F59E0B" },
      ]}
    >
      <View style={styles.createFormHeader}>
        <Text style={[styles.createFormTitle, { color: theme.text }]}>
          Add Special Day Override
        </Text>
        <TouchableOpacity
          style={[styles.closeFormButton, { backgroundColor: theme.surface }]}
          onPress={() => setShowCreateForm(null)}
        >
          <Text style={[styles.closeFormButtonText, { color: theme.text }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createFormContent}>
        {/* Month Selection */}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Month</Text>
          <TouchableOpacity
            style={[
              styles.timeInput,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => showPicker("date", "month", "override")}
          >
            <Text style={[styles.timeInputText, { color: theme.text }]}>
              {getMonthName(newOverride.month)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Selection */}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Day</Text>
          <TouchableOpacity
            style={[
              styles.timeInput,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => showPicker("date", "day", "override")}
          >
            <Text style={[styles.timeInputText, { color: theme.text }]}>
              {newOverride.day}
            </Text>
          </TouchableOpacity>
        </View>

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
                  borderColor: theme.border,
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
                  borderColor: theme.border,
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
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Start Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => showPicker("time", "start_time", "override")}
              >
                <Text style={[styles.timeInputText, { color: theme.text }]}>
                  {newOverride.start_time}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                End Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => showPicker("time", "end_time", "override")}
              >
                <Text style={[styles.timeInputText, { color: theme.text }]}>
                  {newOverride.end_time}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowCreateForm(null)}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: "#F59E0B" }]}
            onPress={createNewOverride}
            disabled={loading}
          >
            <Text style={[styles.createButtonText, { color: "white" }]}>
              {loading ? "Creating..." : "Create Override"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Screen useSafeArea>
      {/* Header with Time, Timezone Tabber, Plus Button and Exit Button */}
      <View style={styles.header}>
        <Text style={[styles.headerTime, { color: theme.textSecondary }]}>
          {getFormattedTime()}
        </Text>
        <View style={styles.headerRight}>
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

          <TouchableOpacity
            style={[styles.exitButton, {}]}
            onPress={confirmLogout}
          >
            <Ionicons name={"power-outline"} size={24} color={Color.blue} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View>
          {/* Greeting Message */}
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingText, { color: theme.text }]}>
              {getGreetingMessage()}
            </Text>
          </View>

          {/* Store Times and Overrides */}
          <View style={styles.storeTimesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Store Schedule
            </Text>
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
                {storeTimes.length > 0 && (
                  <View style={styles.subsection}>
                    <View style={styles.subsectionHeader}>
                      <Text
                        style={[styles.subsectionTitle, { color: theme.text }]}
                      >
                        Regular Hours
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => setShowCreateForm("storeTime")}
                        disabled={loading || showCreateForm !== null}
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
                    <FlatList
                      data={storeTimes}
                      renderItem={renderStoreTimeItem}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      style={styles.storeTimesList}
                    />
                  </View>
                )}

                {/* Store Overrides */}
                {storeOverrides.length > 0 && (
                  <View style={styles.subsection}>
                    <View style={styles.subsectionHeader}>
                      <Text
                        style={[styles.subsectionTitle, { color: theme.text }]}
                      >
                        Special Days & Holidays
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          { backgroundColor: "#F59E0B" },
                        ]}
                        onPress={() => setShowCreateForm("override")}
                        disabled={loading || showCreateForm !== null}
                      >
                        <Text
                          style={[styles.addButtonText, { color: "white" }]}
                        >
                          + Override
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={storeOverrides}
                      renderItem={renderStoreOverrideItem}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      style={styles.storeTimesList}
                    />
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
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.plusButton, { backgroundColor: theme.primary }]}
        onPress={() => setIsBottomSheetVisible(true)}
      >
        <Text style={[styles.plusButtonText, { color: theme.buttonText }]}>
          +
        </Text>
      </TouchableOpacity>

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
                    Time Slots ({useNewYorkTime ? "NYC" : "Local"} Time) -{" "}
                    {selectedDate.formattedDate}
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
                      onPress={() => {
                        console.log("Confirming appointment:", {
                          date: selectedDate.formattedDate,
                          time: selectedTimeSlot.time,
                        });
                        setIsBottomSheetVisible(false);
                        // Here you could navigate to a confirmation screen or save to backend
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
        <DateTimePicker
          value={getPickerValue()}
          mode={showDateTimePicker.type}
          display="spinner"
          themeVariant="light"
          style={{ backgroundColor: "white" }}
          onChange={handleDateTimePickerChange}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  plusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  plusButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  storeTimesSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  storeTimesList: {},
  storeTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
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
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#666",
  },
  storeOverrideItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  storeOverrideDateText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  overrideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overrideBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderRadius: 8,
    borderWidth: 2,
    padding: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 40,
    alignItems: "center",
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
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeInputText: {
    fontSize: 16,
    fontWeight: "500",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeScreen;
