import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface TimeSlot {
  id: string;
  time: string;
  hour: number;
  minute: number;
  isAvailable: boolean;
}

interface TimeSlotsGridProps {
  timeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  onTimeSlotPress: (timeSlot: TimeSlot) => void;
  loading?: boolean;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  timeSlots,
  selectedTimeSlot,
  onTimeSlotPress,
  loading = false,
}) => {
  const { theme } = useTheme();

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
      onPress={() => item.isAvailable && onTimeSlotPress(item)}
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
              backgroundColor: item.isAvailable ? "#22C55E" : "#EF4444",
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        Loading time slots...
      </Text>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        No time slots available
      </Text>
    );
  }

  return (
    <FlatList
      data={timeSlots}
      renderItem={renderTimeSlot}
      keyExtractor={(item) => item.id}
      numColumns={4}
      contentContainerStyle={styles.timeSlotsGrid}
      style={styles.timeSlotsContainer}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default TimeSlotsGrid;
