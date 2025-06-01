import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#333",
          borderRadius: 50,
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: 40,
          height: 72,
          position: "absolute",
          paddingHorizontal: 10,
        },
        tabBarItemStyle: {
          borderRadius: 30,
          marginHorizontal: 5,
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "100",
          marginTop: 8,
          fontFamily: "Manrope_400Regular",
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? '#FF8C00' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? '#FF8C00' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons 
                name={focused ? "search" : "search-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Booking"
        options={{
          title: "Booking",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? '#FF8C00' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons 
                name={focused ? "calendar" : "calendar-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? '#FF8C00' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}