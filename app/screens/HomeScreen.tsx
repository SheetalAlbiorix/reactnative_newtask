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
import { useAuth } from "@/utils/AuthContext";
import { format, formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import {
  createStoreTime,
  getStoreTimes,
  getStoreTimesByDay,
} from "@/network/api/requests/store-times";
import { scheduleNotification } from "@/utils/NotificationsAlert";

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

const HomeScreen = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();

  // Timezone state - true for New York, false for local
  const [useNewYorkTime, setUseNewYorkTime] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DateItem | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [storeTimes, setStoreTimes] = useState<StoreTimesResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // scheduleNotification("Hello!!", "Welcome to App");
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch store times for today initially
  useEffect(() => {
    fetchStoreTimes(new Date().getDay());
  }, []);

  // Regenerate time slots when timezone changes
  useEffect(() => {
    if (selectedDate && storeTimes.length > 0) {
      const slots = generateTimeSlots(selectedDate, storeTimes, useNewYorkTime);
      setTimeSlots(slots);
    }
  }, [useNewYorkTime, selectedDate, storeTimes]);

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

  // Generate 15-minute time slots for all 24 hours
  const generateTimeSlots = (
    date: DateItem,
    storeTimesForDay: StoreTimesResponse[],
    useNYCTimezone: boolean = useNewYorkTime
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.date.getDay();

    // Find store times for this day of week
    const dayStoreTimes = storeTimesForDay.find(
      (st) => st.day_of_week === dayOfWeek
    );

    // If store is closed, return empty array
    if (!dayStoreTimes || !dayStoreTimes.is_open) {
      return slots;
    }

    let storeStartHour = 0;
    let storeStartMinute = 0;
    let storeEndHour = 0;
    let storeEndMinute = 0;

    // Parse start and end times (these are in NYC timezone from API)
    [storeStartHour, storeStartMinute] = dayStoreTimes.start_time
      .split(":")
      .map(Number);
    [storeEndHour, storeEndMinute] = dayStoreTimes.end_time
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

    // Generate 15-minute intervals for all 24 hours (00:00 to 23:45)
    let slotId = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        // Check if this time slot falls within store hours
        const currentTimeInMinutes = hour * 60 + minute;
        const storeStartInMinutes =
          adjustedStoreStartHour * 60 + adjustedStoreStartMinute;
        const storeEndInMinutes =
          adjustedStoreEndHour * 60 + adjustedStoreEndMinute;

        let isAvailable = false;

        // Handle case where store hours cross midnight (e.g., 22:00 to 06:00)
        if (storeEndInMinutes < storeStartInMinutes) {
          isAvailable =
            currentTimeInMinutes >= storeStartInMinutes ||
            currentTimeInMinutes < storeEndInMinutes;
        } else {
          isAvailable =
            currentTimeInMinutes >= storeStartInMinutes &&
            currentTimeInMinutes < storeEndInMinutes;
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
    storeTimesForDay: StoreTimesResponse[]
  ): boolean => {
    const dayOfWeek = date.date.getDay();
    const dayStoreTimes = storeTimesForDay.find(
      (st) => st.day_of_week === dayOfWeek
    );
    return !dayStoreTimes || !dayStoreTimes.is_open;
  };

  const handleDatePress = async (dateItem: DateItem) => {
    setSelectedDate(dateItem);
    const dayOfWeek = dateItem.date.getDay();

    // Clear selected time slot when changing dates
    setSelectedTimeSlot(null);

    // Fetch store times for this specific day if not already loaded
    let storeTimesForGeneration = storeTimes;
    if (!storeTimes.some((st) => st.day_of_week === dayOfWeek)) {
      try {
        setLoading(true);
        const times = await getStoreTimesByDay({ day: dayOfWeek });
        storeTimesForGeneration = times;
        setStoreTimes((prev) => [...prev, ...times]);
      } catch (error) {
        console.error("Error fetching store times for day:", error);
        storeTimesForGeneration = [];
      } finally {
        setLoading(false);
      }
    }

    // Generate time slots for the selected date
    const slots = generateTimeSlots(
      dateItem,
      storeTimesForGeneration,
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

  // Generate the next 30 days
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

  const renderDateItem = ({ item }: { item: DateItem }) => (
    <TouchableOpacity
      style={[
        styles.dateItem,
        {
          backgroundColor:
            selectedDate?.id === item.id ? theme.primary : theme.card,
          borderColor:
            selectedDate?.id === item.id ? theme.primary : theme.border,
        },
      ]}
      onPress={() => handleDatePress(item)}
    >
      <Text
        style={[
          styles.dayName,
          {
            color:
              selectedDate?.id === item.id
                ? theme.buttonText
                : item.isToday
                ? theme.primary
                : theme.text,
          },
        ]}
      >
        {item.dayName}
      </Text>
      <Text
        style={[
          styles.dateText,
          {
            color:
              selectedDate?.id === item.id
                ? theme.buttonText
                : item.isToday
                ? theme.primary
                : theme.textSecondary,
          },
        ]}
      >
        {item.shortDate}
      </Text>
      {item.isToday && selectedDate?.id !== item.id && (
        <Text style={[styles.todayLabel, { color: theme.primary }]}>Today</Text>
      )}
    </TouchableOpacity>
  );

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

  return (
    <Screen useSafeArea>
      {/* Header with Time and Plus Button */}
      <View style={styles.header}>
        <Text style={[styles.headerTime, { color: theme.textSecondary }]}>
          {getFormattedTime()}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.plusButton, { backgroundColor: theme.primary }]}
            onPress={() => setIsBottomSheetVisible(true)}
          >
            <Text style={[styles.plusButtonText, { color: theme.buttonText }]}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View>
          <Button variant="primary" style={styles.button} onPress={logout}>
            Logout
          </Button>
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
              <View style={styles.headerRightModal}>
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
                          color: !useNewYorkTime
                            ? theme.buttonText
                            : theme.text,
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
                  style={[
                    styles.closeButton,
                    { backgroundColor: theme.surface },
                  ]}
                  onPress={() => setIsBottomSheetVisible(false)}
                >
                  <Text style={[styles.closeButtonText, { color: theme.text }]}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.bottomSheetContent}>
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
                  ) : isStoreClosed(selectedDate, storeTimes) ? (
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
                  <Text
                    style={[styles.appointmentTitle, { color: theme.primary }]}
                  >
                    Selected Appointment
                  </Text>
                  <View style={styles.appointmentDetails}>
                    <Text
                      style={[styles.appointmentDate, { color: theme.text }]}
                    >
                      📅 {selectedDate.formattedDate}
                    </Text>
                    <Text
                      style={[styles.appointmentTime, { color: theme.text }]}
                    >
                      🕐 {selectedTimeSlot.time}
                    </Text>
                  </View>
                  <View style={styles.appointmentActions}>
                    <Button
                      variant="secondary"
                      style={styles.clearButton}
                      onPress={() => {
                        setSelectedTimeSlot(null);
                        setSelectedDate(null);
                      }}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="primary"
                      style={styles.confirmButton}
                      onPress={() => {
                        console.log("Confirming appointment:", {
                          date: selectedDate.formattedDate,
                          time: selectedTimeSlot.time,
                        });
                        setIsBottomSheetVisible(false);
                        // Here you could navigate to a confirmation screen or save to backend
                      }}
                    >
                      Confirm Appointment
                    </Button>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  headerRightModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  plusButtonText: {
    fontSize: 18,
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
    maxHeight: Dimensions.get("window").height * 0.8,
    minHeight: Dimensions.get("window").height * 0.5,
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
    padding: 16,
  },
  bottomSheetDatesSection: {
    marginBottom: 24,
  },
  bottomSheetTimeSlotsSection: {
    marginBottom: 24,
  },
  bottomSheetSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  bottomSheetAppointmentContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  datesList: {
    paddingHorizontal: 16,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
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
  todayLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
    textTransform: "uppercase",
  },
  timeSlotsGrid: {
    paddingHorizontal: 16,
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
    alignItems: "center",
    justifyContent: "center",
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
  appointmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  appointmentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  clearButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
});

export default HomeScreen;
