import * as Location from "expo-location";
import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, View, ScrollView, ActivityIndicator, RefreshControl } from "react-native";

// Use environment variable for API URL in production
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.31.99.212:3000";

interface OfficeData {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
}

interface LocationData {
  lat: number;
  lng: number;
}

export default function MarkAttendanceScreen() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [assignedOffices, setAssignedOffices] = useState<OfficeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('');

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    initializeData();
  }, [isLoaded, user]);

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAssignedOffices(),
      getLocation()
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await initializeData();
    setRefreshing(false);
  };

  const getLocation = async () => {
    try {
      // Check initial permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionStatus(status);
        
        if (status !== 'granted') {
          setError("Location permission is required to mark attendance");
          return;
        }
      }

      // Get current location with high accuracy
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000,
        maximumAge: 10000,
      });

      setLocation({ 
        lat: loc.coords.latitude, 
        lng: loc.coords.longitude 
      });

      console.log('Location obtained:', {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy
      });

    } catch (err) {
      console.error("Error getting location:", err);
      setError("Failed to get your current location. Please check your location settings.");
    }
  };

  const fetchAssignedOffices = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/manager/assigned-offices?clerkId=${user.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch assigned offices");
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError("No office assigned to your account. Please contact admin.");
        return;
      }

      setAssignedOffices(data);
      console.log('Assigned offices:', data);
    } catch (err) {
      console.error("Error fetching offices:", err);
      setError("Failed to fetch office details. Please check your internet connection.");
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  };

  const getDistanceToNearestOffice = (): { distance: number; office: OfficeData | null } => {
    if (!location || assignedOffices.length === 0) {
      return { distance: Infinity, office: null };
    }

    let minDistance = Infinity;
    let nearestOffice = null;

    for (const office of assignedOffices) {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        office.latitude,
        office.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestOffice = office;
      }
    }

    return { distance: minDistance, office: nearestOffice };
  };

  const markAttendance = async () => {
    if (!user || !location) {
      Alert.alert("Error", "User authentication or location data not available");
      return;
    }

    if (assignedOffices.length === 0) {
      Alert.alert("Error", "No office assigned to your account");
      return;
    }

    setMarking(true);

    const requestBody = {
      clerkId: user.id,
      latitude: location.lat,
      longitude: location.lng,
    };

    console.log("Marking attendance with data:", requestBody);

    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await res.json();
      console.log("Attendance API response:", responseData);

      if (res.ok) {
        Alert.alert(
          "Success", 
          `Attendance marked successfully!\n\nOffice: ${responseData.attendance?.office || 'Unknown'}\nDistance: ${responseData.distance}m`,
          [{ text: "OK" }]
        );
      } else {
        const errorMessage = responseData.error || "Failed to mark attendance";
        let alertMessage = errorMessage;

        // Add helpful information for location-based errors
        if (responseData.nearestOffice && responseData.distance) {
          alertMessage += `\n\nNearest office: ${responseData.nearestOffice}\nYour distance: ${responseData.distance}m\nRequired distance: ${responseData.requiredDistance || 300}m`;
        }

        Alert.alert("Error", alertMessage);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      Alert.alert("Error", "Network error. Please check your internet connection and try again.");
    } finally {
      setMarking(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color="#0066cc" />
        <Text className="mt-4 text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-500 text-center">
          User not authenticated. Please sign in to continue.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Button title="Retry" onPress={onRefresh} />
      </View>
    );
  }

  const { distance, office: nearestOffice } = getDistanceToNearestOffice();
  const isWithinRange = distance <= 300; // 300 meters

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-6 space-y-6">
        {/* Header */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-2xl font-bold text-gray-800">Mark Attendance</Text>
          <Text className="text-gray-600 mt-1">Welcome, {user.firstName || 'Manager'}</Text>
        </View>

        {/* Location Status */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Location Status</Text>
          
          {location ? (
            <View className="space-y-2">
              <Text className="text-green-600">✅ Location obtained successfully</Text>
              <Text className="text-gray-600">
                Your coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Text>
              <Button title="Refresh Location" onPress={getLocation} />
            </View>
          ) : (
            <View className="space-y-2">
              <Text className="text-red-600">❌ Location not available</Text>
              <Text className="text-gray-600">Permission: {locationPermissionStatus}</Text>
              <Button title="Get Location" onPress={getLocation} />
            </View>
          )}
        </View>

        {/* Assigned Offices */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Assigned Offices ({assignedOffices.length})
          </Text>
          
          {assignedOffices.map((office, index) => {
            const officeDistance = location ? calculateDistance(
              location.lat,
              location.lng,
              office.latitude,
              office.longitude
            ) : null;

            return (
              <View key={office.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                <Text className="font-semibold text-gray-800">{office.officeName}</Text>
                <Text className="text-gray-600 text-sm">
                  Location: {office.latitude.toFixed(6)}, {office.longitude.toFixed(6)}
                </Text>
                {officeDistance !== null && (
                  <Text className={`text-sm mt-1 ${officeDistance <= 300 ? 'text-green-600' : 'text-red-600'}`}>
                    Distance: {Math.round(officeDistance)}m {officeDistance <= 300 ? '(In range)' : '(Out of range)'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Attendance Status */}
        {location && nearestOffice && (
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Attendance Status</Text>
            
            <View className="space-y-2">
              <Text className="text-gray-600">
                Nearest office: <Text className="font-semibold">{nearestOffice.officeName}</Text>
              </Text>
              <Text className="text-gray-600">
                Distance: <Text className="font-semibold">{Math.round(distance)}m</Text>
              </Text>
              <Text className={`font-semibold ${isWithinRange ? 'text-green-600' : 'text-red-600'}`}>
                Status: {isWithinRange ? 'Within range ✅' : 'Out of range ❌'}
              </Text>
              
              {!isWithinRange && (
                <Text className="text-sm text-gray-500 mt-2">
                  You need to be within 300m of your assigned office to mark attendance.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Mark Attendance Button */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Button
            title={marking ? "Marking Attendance..." : "Mark Attendance"}
            onPress={markAttendance}
            disabled={marking || !location || assignedOffices.length === 0}
          />
          
          {(!location || assignedOffices.length === 0) && (
            <Text className="text-sm text-gray-500 mt-2 text-center">
              {!location ? "Location required" : "No offices assigned"}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}