import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface DateItem {
  id: string;
  date: Date;
  formattedDate: string;
  shortDate: string;
  dayName: string;
  isToday: boolean;
}

interface DateSelectorProps {
  dates: DateItem[];
  selectedDate: DateItem | null;
  onDatePress: (dateItem: DateItem) => void;
  getStoreStatus: (date: DateItem) => {
    isOpen: boolean;
    isOverride: boolean;
    statusText: string;
  };
}

const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onDatePress,
  getStoreStatus,
}) => {
  const { theme } = useTheme();

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
        onPress={() => onDatePress(item)}
        activeOpacity={0.7}
      >
        {/* Header with day name and status indicator */}
        <View style={styles.dateItemHeader}>
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
            {storeStatus.statusText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={dates}
      renderItem={renderDateItem}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.datesList}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default DateSelector;
