import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledDate: string;
  scheduledTime: string;
  notificationId: string;
  createdAt: string;
}

interface NotificationsListProps {
  notifications: ScheduledNotification[];
  onAddPress: () => void;
  onCancelPress: (notification: ScheduledNotification) => void;
  loading: boolean;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onAddPress,
  onCancelPress,
  loading,
}) => {
  const { theme } = useTheme();

  const renderNotificationItem = ({
    item,
  }: {
    item: ScheduledNotification;
  }) => (
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
        <Text style={[styles.notificationTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.notificationBody, { color: theme.textSecondary }]}>
          {item.body}
        </Text>
        <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
          📅 {item.scheduledDate} • 🕐 {item.scheduledTime}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.cancelNotificationButton,
          { backgroundColor: "#EF4444" },
        ]}
        onPress={() => onCancelPress(item)}
        disabled={loading}
      >
        <Text style={[styles.cancelNotificationButtonText, { color: "white" }]}>
          {loading ? "..." : "Remove"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.notificationsSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Scheduled Appointments
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={onAddPress}
          disabled={loading}
        >
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={renderNotificationItem}
        />
      ) : (
        <View style={styles.emptyNotificationsContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No scheduled notifications
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
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
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
});

export default NotificationsList;
