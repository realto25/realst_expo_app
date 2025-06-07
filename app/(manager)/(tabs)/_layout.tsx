import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide tab navigator header
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#4B5EAA",
        tabBarStyle: {
          backgroundColor: "#FFF7ED",
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
          headerShown: false, // Explicitly hide stack header
        }}
      />
      <Tabs.Screen
        name="Attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="add-circle-outline" color={color} />
          ),
          headerShown: false, // Explicitly hide stack header
        }}
      />
      <Tabs.Screen
        name="Assign"
        options={{
          title: "Visit Requests",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="list-outline" color={color} />
          ),
          headerShown: false, // Explicitly hide stack header
        }}
      />
    </Tabs>
  );
}
