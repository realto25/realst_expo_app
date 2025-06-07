import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#F97316",
          tabBarInactiveTintColor: "#4B5EAA",
          tabBarStyle: {
            backgroundColor: "#FFF7ED",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Manrope-SemiBold",
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="home-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Attendance"
          options={{
            title: "Attendance",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="add-circle-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Assign"
          options={{
            title: "Visit Requests",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="list-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Leave"
          options={{
            title: "Leave",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="calendar-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="person-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 3,
    backgroundColor: "#FFF7ED",
  },
});
