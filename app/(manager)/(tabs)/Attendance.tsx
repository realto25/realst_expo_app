import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Linking,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native"; 

// Base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://main-admin-dashboard-orpin.vercel.app";
const { width } = Dimensions.get("window");

// iOS-inspired color palette
const colors = {
  primary: "#007AFF", // iOS blue
  secondary: "#34C759", // iOS green
  background: "#F2F2F7", // iOS light gray
  card: "#FFFFFF",
  text: "#1C1C1E",
  subtext: "#3C3C43",
  error: "#FF3B30",
  warning: "#FF9500",
  success: "#34C759",
};

// Interfaces
interface OfficeData {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  requiredDistance?: number;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
}

// Components
const GradientCard = ({ children, colors = [colors.primary, colors.secondary], style = {} }) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      {
        borderRadius: 14, // iOS-like rounded corners
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      },
      style,
    ]}
  >
    {children}
  </LinearGradient>
);

const GlassCard = ({ children, style = {} }) => (
  <View
    style={[
      {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: "rgba(0, 0, 0, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const PulsingDot = ({ size = 12, color = colors.success }) => {
  const pulse = new Animated.Value(1);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ scale: pulse }],
      }}
    />
  );
};

export default function MarkAttendanceScreen() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [assignedOffices, setAssignedOffices] = useState<OfficeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>("");
  const [lastTap, setLastTap] = useState<number>(0); // For double-tap prevention

  const ACCEPTABLE_GPS_ACCURACY_THRESHOLD = 50; // 50 meters

  useEffect(() => {
    if (!isLoaded || !user) return;
    initializeData();
  }, [isLoaded, user]);

  const initializeData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAssignedOffices(), getLocation()]);
    } catch (err) {
      setError("Failed to initialize data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await initializeData();
    setRefreshing(false);
  };

  const getLocation = async () => {
    setError(null);
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(existingStatus);

      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionStatus(status);

        if (status !== "granted") {
          Alert.alert(
            "Location Permission Needed",
            "Location access is required to mark attendance. Please enable it in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings().catch(() => {
                  Alert.alert("Error", "Unable to open settings. Please enable location manually.");
                }),
              },
            ]
          );
          setError("Location permission denied.");
          setLocation(null);
          return;
        }
      }

      if (Platform.OS === "android") {
        try {
          await Location.enableNetworkProviderAsync();
        } catch (e) {
          console.warn("Network provider enable failed:", e);
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000,
        maximumAge: 10000,
      });

      if (loc.coords.accuracy && loc.coords.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD) {
        setError(
          `Location accuracy too low (${loc.coords.accuracy.toFixed(2)}m). ` +
          `Please move to an open area for better GPS signal.`
        );
        setLocation(null);
        return;
      }

      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });

      console.log("Location obtained:", {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });
    } catch (err) {
      console.error("Error getting location:", err);
      setError(
        err.message.includes("timeout")
          ? "Location request timed out. Please try again."
          : "Failed to get location. Check location settings and try again."
      );
      setLocation(null);
    }
  };

  const fetchAssignedOffices = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/manager/assigned-offices?clerkId=${user.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid office data format.");
      }

      if (data.length === 0) {
        setError("No offices assigned to your account. Contact admin.");
        return;
      }

      const isValid = data.every(
        (office) =>
          office.id &&
          office.officeName &&
          typeof office.latitude === "number" &&
          typeof office.longitude === "number"
      );
      if (!isValid) {
        throw new Error("Invalid office data structure.");
      }

      setAssignedOffices(data);
      console.log("Assigned offices:", data);
    } catch (err) {
      console.error("Error fetching offices:", err);
      setError(
        err.message.includes("Network request failed")
          ? "Network error. Please check your internet connection."
          : err.message || "Failed to fetch office details."
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    // Prevent rapid taps (debounce)
    const now = Date.now();
    if (now - lastTap < 1000) return; // 1-second debounce
    setLastTap(now);

    if (!user || !location) {
      Alert.alert("Error", "User authentication or location data unavailable.");
      return;
    }

    if (assignedOffices.length === 0) {
      Alert.alert("Error", "No offices assigned to your account.");
      return;
    }

    if (location.accuracy && location.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD) {
      Alert.alert(
        "Low Accuracy",
        `Location accuracy is ${location.accuracy.toFixed(0)}m, which is too low. ` +
        `Move to an open area for better GPS signal.`,
        [
          { text: "OK" },
          { text: "Try Anyway", onPress: () => proceedWithAttendance() },
        ]
      );
      return;
    }

    // Simulate mock location detection (since library is commented out)
    const isMockingLocation = false; // Replace with actual mock detection if implemented
    if (isMockingLocation) {
      Alert.alert("Security Alert", "Mock location detected. Attendance cannot be marked.");
      return;
    }

    const { distance, office: nearestOffice } = getDistanceToNearestOffice();
    const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000;
    if (!nearestOffice || distance > requiredGeofenceDistance) {
      Alert.alert(
        "Out of Range",
        `You are too far from the office.\n\nNearest office: ${nearestOffice?.officeName || "Unknown"}\nYour distance: ${
          distance >= 1000 ? (distance / 1000).toFixed(1) + "km" : Math.round(distance) + "m"
        }\nRequired distance: Within ${requiredGeofenceDistance}m`
      );
      return;
    }

    setMarking(true);
    Vibration.vibrate(50); // Haptic feedback for iOS-like feel

    const requestBody = {
      clerkId: user.id,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseData = await res.json();
      if (res.ok) {
        Alert.alert(
          "Success",
          `Attendance marked successfully!\n\nOffice: ${responseData.attendance?.officeName || nearestOffice.officeName}\nDistance: ${Math.round(distance)}m`,
          [{ text: "OK" }]
        );
        Vibration.vibrate([50, 100, 50]); // Success haptic pattern
      } else {
        let alertMessage = responseData.error || "Failed to mark attendance";
        if (responseData.nearestOffice && responseData.distance) {
          alertMessage += `\n\nNearest office: ${responseData.nearestOffice}\nYour distance: ${responseData.distance}m\nRequired distance: ${responseData.requiredDistance || "N/A"}m`;
        }
        Alert.alert("Error", alertMessage);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      Alert.alert(
        "Network Error",
        "Failed to connect to the server. Please check your internet and try again."
      );
    } finally {
      setMarking(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <StatusBar barStyle="light-content" />
          <LottieView
            source={require("../../../assets/loading-animation.json")} 
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text
            style={{
              marginTop: 16,
              color: "#ffffff",
              fontSize: 18,
              fontWeight: "600",
              opacity: 0.9,
            }}
            accessibilityLabel="Loading workspace"
          >
            Loading your workspace...
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.error, colors.warning]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
        >
          <StatusBar barStyle="light-content" />
          <Ionicons
            name="person-circle-outline"
            size={80}
            color="#ffffff"
            accessibilityLabel="Authentication required"
          />
          <Text
            style={{
              color: "#ffffff",
              fontSize: 20,
              textAlign: "center",
              marginTop: 16,
              fontWeight: "600",
            }}
          >
            Authentication Required
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 16,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Please sign in to continue
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.error, colors.warning]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
        >
          <StatusBar barStyle="light-content" />
          <Ionicons
            name="warning-outline"
            size={64}
            color="#ffffff"
            accessibilityLabel="Error occurred"
          />
          <Text
            style={{
              color: "#ffffff",
              fontSize: 18,
              textAlign: "center",
              marginVertical: 16,
              fontWeight: "600",
              paddingHorizontal: 24,
            }}
          >
            {error}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onRefresh}
              accessibilityLabel="Retry fetching data"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
                Try Again
              </Text>
            </TouchableOpacity>
            {error.includes("Location permission") && (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                accessibilityLabel="Open device settings"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const { distance, office: nearestOffice } = getDistanceToNearestOffice();
  const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000;
  const isWithinRange = distance <= requiredGeofenceDistance;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      <GradientCard
        colors={[colors.primary, colors.secondary]}
        style={{ marginBottom: 0, borderRadius: 0, paddingTop: 24 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text
              style={{ fontSize: 28, fontWeight: "700", color: "#ffffff", marginBottom: 4 }}
              accessibilityLabel={`Greeting ${user.firstName || "Manager"}`}
            >
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
            </Text>
            <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
              {user.firstName || "Manager"}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <PulsingDot size={16} color={colors.success} />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </GradientCard>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Status */}
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <LinearGradient
              colors={location ? [colors.success, colors.secondary] : [colors.error, colors.warning]}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Ionicons
                name={location ? "location" : "location-outline"}
                size={24}
                color="#ffffff"
                accessibilityLabel={location ? "Location connected" : "Location required"}
              />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 }}
              >
                Location Status
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: location ? colors.success : colors.error,
                  fontWeight: "600",
                }}
              >
                {location ? "Connected & Ready" : "Location Required"}
              </Text>
            </View>
          </View>
          {location ? (
            <View style={{ backgroundColor: "rgba(52, 199, 89, 0.1)", padding: 16, borderRadius: 12 }}>
              <Text style={{ color: colors.success, fontSize: 14, marginBottom: 8 }}>
                📍 Current Location
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace" }}>
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace", marginTop: 4 }}>
                Accuracy: {location.accuracy !== null ? `${location.accuracy.toFixed(2)}m` : "N/A"}
              </Text>
              <TouchableOpacity
                onPress={getLocation}
                accessibilityLabel="Refresh current location"
                style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignSelf: "flex-start",
                  marginTop: 12,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
                  Refresh Location
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ backgroundColor: "rgba(255, 59, 48, 0.1)", padding: 16, borderRadius: 12 }}>
              <Text style={{ color: colors.error, fontSize: 14, marginBottom: 8 }}>
                🚫 Location Access Needed
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 12 }}>
                Permission: {locationPermissionStatus} {error && `(${error})`}
              </Text>
              <TouchableOpacity
                onPress={getLocation}
                accessibilityLabel="Enable location permissions"
                style={{
                  backgroundColor: colors.error,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
                  Enable Location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Attendance Status */}
        {location && nearestOffice && (
          <GradientCard colors={isWithinRange ? [colors.success, colors.secondary] : [colors.warning, colors.error]}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name={isWithinRange ? "checkmark-circle" : "warning"}
                  size={40}
                  color="#ffffff"
                  accessibilityLabel={isWithinRange ? "Ready to clock in" : "Out of office range"}
                />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                {isWithinRange ? "Ready to Clock In!" : "Move Closer to Office"}
              </Text>
            </View>
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>Nearest Office</Text>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
                  {nearestOffice.officeName}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>Distance</Text>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
                  {distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>Status</Text>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
                  {isWithinRange ? "Within Range ✅" : "Out of Range ⚠️"}
                </Text>
              </View>
              {!isWithinRange && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 12,
                    marginTop: 12,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  You need to be within {requiredGeofenceDistance / 1000}km ({requiredGeofenceDistance}m) of your assigned office
                </Text>
              )}
            </View>
          </GradientCard>
        )}

        {/* Assigned Offices */}
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Ionicons
                name="business"
                size={24}
                color="#ffffff"
                accessibilityLabel="Offices assigned"
              />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
                Your Offices
              </Text>
              <Text style={{ fontSize: 14, color: colors.subtext }}>
                {assignedOffices.length} office{assignedOffices.length !== 1 ? "s" : ""} assigned
              </Text>
            </View>
          </View>
          {assignedOffices.map((office, index) => {
            const officeDistance = location
              ? calculateDistance(location.lat, location.lng, office.latitude, office.longitude)
              : null;
            const officeRequiredDistance = office.requiredDistance || 1000;
            const inRange = officeDistance !== null && officeDistance <= officeRequiredDistance;

            return (
              <View
                key={office.id}
                style={{
                  backgroundColor: inRange ? "rgba(52, 199, 89, 0.1)" : "rgba(60, 60, 67, 0.1)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: index < assignedOffices.length - 1 ? 12 : 0,
                  borderLeftWidth: 4,
                  borderLeftColor: inRange ? colors.success : colors.subtext,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 }}
                  >
                    {office.officeName}
                  </Text>
                  {officeDistance !== null && (
                    <View
                      style={{
                        backgroundColor: inRange ? colors.success : colors.subtext,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
                        {officeDistance >= 1000
                          ? `${(officeDistance / 1000).toFixed(1)}km`
                          : `${Math.round(officeDistance)}m`}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.subtext,
                    fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace",
                  }}
                >
                  📍 {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                </Text>
                {officeDistance !== null && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: inRange ? colors.success : colors.text,
                      marginTop: 4,
                      fontWeight: "500",
                    }}
                  >
                    {inRange ? "✅ In range for attendance" : "⚠️ Move closer to mark attendance"}
                  </Text>
                )}
              </View>
            );
          })}
        </GlassCard>

        {/* Mark Attendance Button */}
        <TouchableOpacity
          onPress={markAttendance}
          disabled={marking || !location || assignedOffices.length === 0 || !isWithinRange}
          accessibilityLabel={
            marking
              ? "Marking attendance"
              : !location
              ? "Location not available"
              : assignedOffices.length === 0
              ? "No offices assigned"
              : !isWithinRange
              ? "Out of office range"
              : "Mark attendance"
          }
          style={{
            opacity: marking || !location || assignedOffices.length === 0 || !isWithinRange ? 0.6 : 1,
            marginBottom: 40,
          }}
        >
          <LinearGradient
            colors={
              isWithinRange && location && assignedOffices.length > 0
                ? [colors.success, colors.secondary]
                : ["#D1D1D6", "#AEAEB2"]
            }
            style={{
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            {marking ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                  style={{ marginRight: 12 }}
                  accessibilityLabel="Marking attendance, please wait"
                />
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "700" }}>
                  Marking Attendance...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time" size={24} color="#ffffff" style={{ marginRight: 12 }} />
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "700" }}>
                  Mark Attendance
                </Text>
              </View>
            )}
          </LinearGradient>
          {(!location || assignedOffices.length === 0 || !isWithinRange) && (
            <Text
              style={{
                fontSize: 14,
                color: colors.subtext,
                textAlign: "center",
                marginTop: 12,
                fontStyle: "italic",
              }}
            >
              {!location
                ? "📍 Location required and accurate"
                : assignedOffices.length === 0
                ? "🏢 No offices assigned"
                : `📏 Move within ${requiredGeofenceDistance / 1000}km of office`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
