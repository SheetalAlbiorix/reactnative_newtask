import { useState, useEffect, useMemo } from "react";
import { addDays, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  getStoreTimes,
  deleteStoreTimeByID,
  createStoreTime,
} from "@/network/api/requests/store-times";
import {
  getStoreOverrides,
  deleteStoreOverrideById,
  createStoreOverride,
} from "@/network/api/requests/store-override";
import {
  scheduleNotificationAtTime,
  cancelNotification,
  saveScheduledNotification,
  getScheduledNotifications,
  removeScheduledNotification,
  ScheduledNotification,
} from "@/utils/NotificationsAlert";

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

export const useStoreManagement = () => {
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
  const [scheduledNotifications, setScheduledNotifications] = useState<
    ScheduledNotification[]
  >([]);

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

  // Fetch functions
  const fetchAllStoreTimes = async () => {
    try {
      setLoading(true);
      const times = await getStoreTimes();
      setStoreTimes(times);
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

  // Store availability logic
  const getStoreAvailabilityForDate = (
    date: Date,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[]
  ) => {
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // First check for store overrides
    const override = allStoreOverrides.find(
      (override) => override.month === month && override.day === day
    );

    if (override) {
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

  // Generate time slots (always in NYC timezone)
  const generateTimeSlots = (
    date: DateItem,
    allStoreTimes: StoreTimesResponse[],
    allStoreOverrides: StoreOverrideResponse[]
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    const storeAvailability = getStoreAvailabilityForDate(
      date.date,
      allStoreTimes,
      allStoreOverrides
    );

    if (!storeAvailability.isOpen || storeAvailability.hours.length === 0) {
      return slots;
    }

    // Generate 15-minute intervals for all 24 hours in NYC time
    let slotId = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        const currentTimeInMinutes = hour * 60 + minute;
        let isAvailable = false;

        // Check against all store hours for this day
        for (const storeHour of storeAvailability.hours) {
          const [storeStartHour, storeStartMinute] = storeHour.start_time
            .split(":")
            .map(Number);
          const [storeEndHour, storeEndMinute] = storeHour.end_time
            .split(":")
            .map(Number);

          const storeStartInMinutes = storeStartHour * 60 + storeStartMinute;
          const storeEndInMinutes = storeEndHour * 60 + storeEndMinute;

          // Handle case where store hours cross midnight
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
  const isStoreClosed = (date: DateItem): boolean => {
    const storeAvailability = getStoreAvailabilityForDate(
      date.date,
      storeTimes,
      storeOverrides
    );
    return !storeAvailability.isOpen;
  };

  // Get store status for display
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

  // Handle date selection
  const handleDatePress = async (dateItem: DateItem) => {
    setSelectedDate(dateItem);
    setSelectedTimeSlot(null);

    const slots = generateTimeSlots(dateItem, storeTimes, storeOverrides);
    setTimeSlots(slots);
  };

  // Handle time slot selection
  const handleTimeSlotPress = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Delete functions
  const deleteStoreTime = async (storeTimeId: string) => {
    try {
      await deleteStoreTimeByID(storeTimeId);
      await fetchAllStoreTimes();

      if (selectedDate) {
        const slots = generateTimeSlots(
          selectedDate,
          storeTimes.filter((st) => st.id !== storeTimeId),
          storeOverrides
        );
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error deleting store time:", error);
    } finally {
    }
  };

  const deleteStoreOverride = async (storeOverrideId: string) => {
    try {
      await deleteStoreOverrideById({ id: storeOverrideId });
      await fetchAllStoreOverrides();

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
    }
  };

  // Appointment confirmation
  const confirmAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) return;

    try {
      // Create appointment date in NYC timezone
      const [hours, minutes] = selectedTimeSlot.time.split(":").map(Number);

      const appointmentDateNYC = new Date(selectedDate.date);
      appointmentDateNYC.setHours(hours, minutes, 0, 0);

      // Convert NYC time to local timezone
      const nycTimeZone = "America/New_York";
      const appointmentInLocal = fromZonedTime(appointmentDateNYC, nycTimeZone);

      // Schedule notification 15 minutes before appointment
      const notificationTime = new Date(
        appointmentInLocal.getTime() - 15 * 60 * 1000
      );
      const localTimeString = format(appointmentInLocal, "HH:mm");

      if (notificationTime > new Date()) {
        const notificationId = await scheduleNotificationAtTime(
          "Appointment Reminder",
          `You have an appointment scheduled at ${selectedTimeSlot.time} NYC time (${localTimeString} local time) on ${selectedDate.formattedDate}`,
          notificationTime
        );

        if (notificationId) {
          const newNotification: ScheduledNotification = {
            id: Date.now().toString(),
            title: "Appointment Reminder",
            body: `You have an appointment scheduled at ${selectedTimeSlot.time} NYC time (${localTimeString} local time) on ${selectedDate.formattedDate}`,
            scheduledDate: notificationTime.toISOString().split("T")[0],
            scheduledTime: notificationTime.toTimeString().slice(0, 5),
            notificationId: notificationId,
            createdAt: new Date().toISOString(),
          };

          saveScheduledNotification(newNotification);
          loadScheduledNotifications();
        }
      }

      return {
        nycTime: selectedTimeSlot.time,
        localTime: localTimeString,
        date: selectedDate.formattedDate,
      };
    } catch (error) {
      console.error("Error confirming appointment:", error);
      throw error;
    }
  };

  // Cancel notification
  const handleCancelNotification = async (
    notification: ScheduledNotification
  ) => {
    try {
      setLoading(true);
      const success = await cancelNotification(notification.notificationId);

      if (success) {
        removeScheduledNotification(notification.id);
        loadScheduledNotifications();
      }
    } catch (error) {
      console.error("Error cancelling notification:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTimeSlot(null);
    setSelectedDate(null);
  };

  // Initialize data
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

  return {
    // State
    selectedDate,
    timeSlots,
    storeTimes,
    storeOverrides,
    loading,
    selectedTimeSlot,
    scheduledNotifications,
    next30Days,

    // Functions
    handleDatePress,
    handleTimeSlotPress,
    deleteStoreTime,
    deleteStoreOverride,
    confirmAppointment,
    handleCancelNotification,
    clearSelection,
    getStoreStatus,
    isStoreClosed,
    fetchAllStoreTimes,
    fetchAllStoreOverrides,
    loadScheduledNotifications,
  };
};
