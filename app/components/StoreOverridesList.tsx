import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface StoreOverrideResponse {
  id: string;
  day: number;
  month: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

interface StoreOverridesListProps {
  storeOverrides: StoreOverrideResponse[];
  onAddPress: () => void;
  onDeletePress: (id: string) => void;
  formatOverrideDate: (month: number, day: number) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const StoreOverridesList: React.FC<StoreOverridesListProps> = ({
  storeOverrides,
  onAddPress,
  onDeletePress,
  formatOverrideDate,
  isExpanded,
  onToggleExpand,
}) => {
  const { theme } = useTheme();

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
        onPress={() => onDeletePress(item.id)}
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

  return (
    <View style={styles.subsection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
      >
        <View style={styles.subsectionHeader}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>
            Special Days & Holidays ({storeOverrides.length})
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#F59E0B" }]}
              onPress={onAddPress}
            >
              <Text style={[styles.addButtonText, { color: "white" }]}>
                + Override
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      {isExpanded && storeOverrides.length > 0 && (
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  storeTimeInfo: {
    flex: 1,
  },
  storeTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  storeOverrideDateText: {
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

export default StoreOverridesList;
