import * as Location from "expo-location";
import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, View } from "react-native";

// Use environment variable for API URL in production
const API_URL = "http://192.168.29.85:3000"; // Replace with process.env.EXPO_PUBLIC_API_URL in production

export default function MarkAttendanceScreen() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [assignedOffice, setAssignedOffice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!isLoaded || !user) return;
      await fetchOffice();
      await getLocation();
      setLoading(false);
    })();
  }, [isLoaded, user]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setError("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (err) {
      console.error("Error getting location:", err);
      setError("Failed to get location");
    }
  };

  const fetchOffice = async () => {
    try {
      const res = await fetch(`${API_URL}/api/manager/assingned-offices?clerkId=${user?.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch assigned offices");
      }
      const data = await res.json();
      if (data.length === 0) {
        setError("No office assigned to this manager");
        return;
      }
      setAssignedOffice(data[0]);
    } catch (err) {
      console.error("Error fetching office:", err);
      setError("Failed to fetch office details");
    }
  };

  const markAttendance = async () => {
    if (!user || !location || !assignedOffice) {
      Alert.alert("Error", "User, location, or office data not available");
      return;
    }
  
    const requestBody = {
      clerkId: user.id,
      latitude: location.lat,
      longitude: location.lng,
    };
    console.log("Sending request to /api/attendance with body:", requestBody);
  
    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      // Log the raw response text before parsing
      const rawResponse = await res.text();
      console.log("Raw response from /api/attendance:", rawResponse);
  
      // Try to parse the response as JSON
      const responseData = JSON.parse(rawResponse);
      console.log("Parsed response from /api/attendance:", responseData);
  
      if (res.ok) {
        Alert.alert("Success", "Attendance marked!");
      } else {
        Alert.alert("Error", responseData.error || "Failed to mark attendance");
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      Alert.alert("Error", "Failed to mark attendance");
    }
  };
  if (!isLoaded || loading) {
    return <Text className="p-6 text-gray-500">Loading...</Text>;
  }

  if (!user) {
    return <Text className="p-6 text-red-500">User not authenticated. Please sign in.</Text>;
  }

  if (error) {
    return <Text className="p-6 text-red-500">{error}</Text>;
  }

  if (!location || !assignedOffice) {
    return <Text className="p-6 text-red-500">Unable to load location or office data</Text>;
  }

  return (
    <View className="p-6 space-y-4">
      <Text className="text-xl font-bold">Mark Attendance</Text>
      <Text>Office: {assignedOffice.officeName}</Text>
      <Text>Office location: {assignedOffice.latitude.toFixed(4)}, {assignedOffice.longitude.toFixed(4)}</Text>
      <Text>Your location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>
      <Button title="Mark Attendance" onPress={markAttendance} />
    </View>
  );
}