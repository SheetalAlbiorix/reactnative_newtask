import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface StoreTimesResponse {
  id: string;
  day_of_week: number;
  end_time: string;
  is_open: boolean;
  start_time: string;
}

interface StoreTimesListProps {
  storeTimes: StoreTimesResponse[];
  onAddPress: () => void;
  onDeletePress: (id: string) => void;
  getDayName: (dayOfWeek: number) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const StoreTimesList: React.FC<StoreTimesListProps> = ({
  storeTimes,
  onAddPress,
  onDeletePress,
  getDayName,
  isExpanded,
  onToggleExpand,
}) => {
  const { theme } = useTheme();

  const renderStoreTimeItem = ({ item }: { item: StoreTimesResponse }) => (
    <View
      style={[
        styles.horizontalStoreTimeItem,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDeletePress(item.id)}
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

  return (
    <View style={styles.subsection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
      >
        <View style={styles.subsectionHeader}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>
            Regular Hours ({storeTimes.length})
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={onAddPress}
            >
              <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
                + Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      {isExpanded && (
        <FlatList
          data={storeTimes}
          renderItem={renderStoreTimeItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
          contentContainerStyle={styles.horizontalListContent}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
                No store times available
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subsection: {
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
});

export default StoreTimesList;
