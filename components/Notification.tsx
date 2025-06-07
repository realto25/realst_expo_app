import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

// Mock API function (replace with actual API call)
const fetchNotifications = async () => {
  // Simulating API call with mock data
  return new Promise<Notification[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "New Visit Request",
          message: "John Doe requested a visit for Plot A1",
          type: "VISIT_REQUEST",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          id: "2",
          title: "Status Update",
          message: "Visit request for Plot B2 approved",
          type: "STATUS_UPDATE",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
        },
        {
          id: "3",
          title: "Reminder",
          message: "Follow-up needed for Plot C3 visit",
          type: "REMINDER",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: false,
        },
      ]);
    }, 1000);
  });
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "VISIT_REQUEST" | "STATUS_UPDATE" | "REMINDER";
  timestamp: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const isDarkMode = colorScheme === "dark";

  // Fetch notifications with retry logic
  const fetchData = async (retries = 3, delay = 1000) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchData(retries - 1, delay * 2);
      }
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please check your connection.");
      Alert.alert("Error", "Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  // Dynamic styles based on theme
  const colors = {
    background: isDarkMode ? "#1F2937" : "#F3F4F6",
    card: isDarkMode ? "#374151" : "#FFFFFF",
    textPrimary: isDarkMode ? "#F9FAFB" : "#1F2937",
    textSecondary: isDarkMode ? "#D1D5DB" : "#4B5563",
    accent: "#F97316",
    primary: "#3B82F6",
    secondary: "#8B5CF6",
  };

  // Notification type styling
  const getNotificationStyle = (type: Notification["type"]) => {
    switch (type) {
      case "VISIT_REQUEST":
        return { icon: "person-add-outline", color: colors.primary };
      case "STATUS_UPDATE":
        return { icon: "checkmark-circle-outline", color: colors.secondary };
      case "REMINDER":
        return { icon: "alarm-outline", color: colors.accent };
      default:
        return { icon: "notifications-outline", color: colors.textSecondary };
    }
  };

  if (loading && notifications.length === 0 && !error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text
            style={{
              color: "#EF4444",
              textAlign: "center",
              marginVertical: 16,
              fontSize: 16,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-500 px-6 py-3 rounded-lg flex-row items-center"
            accessibilityLabel="Retry loading notifications"
          >
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === "android" ? 25 : 0,
      }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          className="flex-row justify-between items-center p-4"
          style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: isDarkMode ? "#4B5563" : "#E5E7EB" }}
        >
          <Text
            style={{
              fontSize: isTablet ? 28 : 24,
              fontWeight: "bold",
              color: colors.textPrimary,
            }}
          >
            Notifications
          </Text>
          <TouchableOpacity
            accessibilityLabel="Go back to dashboard"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={isTablet ? 28 : 24} color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Notification List */}
        <View className="p-4">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.duration(300).delay(index * 100)}
              >
                <TouchableOpacity
                  className="flex-row items-center rounded-xl p-4 mb-3 shadow-sm"
                  style={{ backgroundColor: notification.read ? colors.card : isDarkMode ? "#4B5563" : "#FEF3C7" }}
                  onPress={() => {
                    markAsRead(notification.id);
                    // Navigate to relevant screen based on type (e.g., Assign for VISIT_REQUEST)
                    if (notification.type === "VISIT_REQUEST") {
                      router.push(`/(manager)/(tabs)/Assign/${notification.id}`);
                    }
                  }}
                  accessibilityLabel={`View ${notification.title}`}
                >
                  <View
                    className="w-12 h-12 rounded-full justify-center items-center mr-4"
                    style={{ backgroundColor: getNotificationStyle(notification.type).color + "33" }}
                  >
                    <Ionicons
                      name={getNotificationStyle(notification.type).icon}
                      size={isTablet ? 28 : 24}
                      color={getNotificationStyle(notification.type).color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        fontSize: isTablet ? 18 : 16,
                        fontWeight: notification.read ? "500" : "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {notification.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {new Date(notification.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            !loading && (
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                No notifications available.
              </Text>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
