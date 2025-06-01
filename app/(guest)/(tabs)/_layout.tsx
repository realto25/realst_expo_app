import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const TabIcon = ({ name, focused, color, size }: { name: string; focused: boolean; color: string; size: number }) => {
  const scale = useSharedValue(focused ? 1.1 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  React.useEffect(() => {
    scale.value = focused ? 1.1 : 1;
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.tabIconContainer,
        animatedStyle,
        { backgroundColor: focused ? "#FF8C00" : "transparent" },
      ]}
    >
      <Ionicons name={focused ? name : `${name}-outline`} size={size} color={focused ? "#FFFFFF" : color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#6B7280",
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon name="home" focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon name="search" focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Booking"
          options={{
            title: "Booking",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon name="calendar" focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon name="person" focused={focused} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "FFFFFF",
  },
  tabBar: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 100,
    marginHorizontal: width * 0.05,
    marginBottom: Platform.OS === "ios" ? 20 : 30,
    height: 64,
    paddingHorizontal: 8,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  tabBarItem: {
    borderRadius: 20,
    marginHorizontal: 4,
    paddingVertical: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    marginTop: 4,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
