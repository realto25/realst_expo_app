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
import { LinearGradient } from "expo-linear-gradient"; // Still used for some subtle effects, but with orange tones
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

// Base URL - fixed to use consistent URL
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://main-admin-dashboard-orpin.vercel.app";
const { width } = Dimensions.get("window");

// Orange-inspired minimalistic color palette
const colors = {
  primary: "#FF8C00", // Darker orange
  secondary: "#FFA500", // Brighter orange
  background: "#F8F8F8", // Light gray background
  card: "#FFFFFF", // White cards
  text: "#333333", // Dark gray for main text
  subtext: "#666666", // Medium gray for subtext
  error: "#DC3545", // Red for errors
  warning: "#FFC107", // Yellow for warnings
  success: "#28A745", // Green for success (kept distinct from orange for clarity)
  border: "#E0E0E0", // Light gray for borders
  lightBackground: "#FFF3E0", // Very light orange for tinted backgrounds
};

// Interfaces (unchanged)
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
// Removed GradientCard as per request for minimalistic design, using a simpler Card
const Card = ({ children, style = {} }) => (
  <View
    style={[
      {
        backgroundColor: colors.card,
        borderRadius: 12, // Slightly less rounded
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, // Subtle shadow
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1, // Add a subtle border
        borderColor: colors.border,
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
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<string>("");
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
      console.error("Initialization error:", err);
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
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();
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
                onPress: () =>
                  Linking.openSettings().catch(() => {
                    Alert.alert(
                      "Error",
                      "Unable to open settings. Please enable location manually."
                    );
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
          // This API is deprecated or not available on all Android versions/devices.
          // It's generally better to let the user enable it through system settings if needed.
          // await Location.enableNetworkProviderAsync();
        } catch (e) {
          console.warn("Network provider enable failed:", e);
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000,
        maximumAge: 10000,
      });

      if (
        loc.coords.accuracy &&
        loc.coords.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD
      ) {
        setError(
          `Location accuracy too low (${loc.coords.accuracy.toFixed(
            2
          )}m). ` + `Please move to an open area for better GPS signal.`
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
        err.message?.includes("timeout")
          ? "Location request timed out. Please try again."
          : "Failed to get location. Check location settings and try again."
      );
      setLocation(null);
    }
  };

  const fetchAssignedOffices = async () => {
    if (!user?.id) {
      console.error("No user ID available");
      setError("User authentication required.");
      return;
    }

    try {
      console.log("Fetching assigned offices for user:", user.id);

      const url = `${API_URL}/api/manager/assigned-offices?clerkId=${encodeURIComponent(
        user.id
      )}`;
      console.log("Request URL:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // timeout: 15000, // Fetch API doesn't have a built-in timeout, consider AbortController
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);

        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.error ||
            errorData.message ||
            `HTTP error! status: ${res.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${res.status}`;
        }

        if (res.status === 404) {
          setError("No offices assigned to your account. Contact admin.");
          return;
        } else if (res.status === 401) {
          setError("Authentication failed. Please sign in again.");
          return;
        } else if (res.status >= 500) {
          setError("Server error. Please try again later.");
          return;
        }

        throw new Error(errorMessage);
      }

      const responseText = await res.text();
      console.log("Response body:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response format from server.");
      }

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
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
        console.error("Invalid office data structure:", data);
        throw new Error("Invalid office data structure.");
      }

      setAssignedOffices(data);
      console.log("Assigned offices set:", data);
    } catch (err) {
      console.error("Error fetching offices:", err);

      if (err.name === "TypeError" && err.message.includes("Network request failed")) {
        setError("Network error. Please check your internet connection.");
      } else if (err.name === "AbortError" || err.message?.includes("timeout")) {
        setError("Request timeout. Please try again.");
      } else {
        setError(err.message || "Failed to fetch office details.");
      }
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistanceToNearestOffice = (): {
    distance: number;
    office: OfficeData | null;
  } => {
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

  const proceedWithAttendance = async () => {
    if (!user || !location) {
      Alert.alert("Error", "User authentication or location data unavailable.");
      return;
    }

    if (assignedOffices.length === 0) {
      Alert.alert("Error", "No offices assigned to your account.");
      return;
    }

    setMarking(true);
    Vibration.vibrate(50); // Haptic feedback

    const { distance, office: nearestOffice } = getDistanceToNearestOffice();

    const requestBody = {
      clerkId: user.id,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      // Add additional context
      deviceInfo: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("Sending attendance request:", requestBody);

    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        // timeout: 15000, // Fetch API doesn't have a built-in timeout, consider AbortController
      });

      console.log("Attendance response status:", res.status);

      const responseText = await res.text();
      console.log("Attendance response body:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse attendance response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (res.ok) {
        Alert.alert(
          "Success",
          `Attendance marked successfully!\n\nOffice: ${
            responseData.attendance?.officeName ||
            nearestOffice?.officeName ||
            "Unknown"
          }\nDistance: ${Math.round(distance)}m`,
          [{ text: "OK" }]
        );
        Vibration.vibrate([50, 100, 50]); // Success haptic pattern
      } else {
        let alertMessage =
          responseData.error || responseData.message || "Failed to mark attendance";
        if (responseData.nearestOffice && responseData.distance) {
          alertMessage += `\n\nNearest office: ${responseData.nearestOffice}\nYour distance: ${responseData.distance}m\nRequired distance: ${responseData.requiredDistance || "N/A"}m`;
        }
        Alert.alert("Error", alertMessage);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);

      let errorMessage =
        "Failed to connect to the server. Please check your internet and try again.";

      if (err.name === "TypeError" && err.message.includes("Network request failed")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.name === "AbortError" || err.message?.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert("Network Error", errorMessage);
    } finally {
      setMarking(false);
    }
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

    if (
      location.accuracy &&
      location.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD
    ) {
      Alert.alert(
        "Low Accuracy",
        `Location accuracy is ${location.accuracy.toFixed(
          0
        )}m, which is too low. ` + `Move to an open area for better GPS signal.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Anyway", onPress: () => proceedWithAttendance() },
        ]
      );
      return;
    }

    const { distance, office: nearestOffice } = getDistanceToNearestOffice();
    const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000;

    if (!nearestOffice || distance > requiredGeofenceDistance) {
      Alert.alert(
        "Out of Range",
        `You are too far from the office.\n\nNearest office: ${
          nearestOffice?.officeName || "Unknown"
        }\nYour distance: ${
          distance >= 1000
            ? (distance / 1000).toFixed(1) + "km"
            : Math.round(distance) + "m"
        }\nRequired distance: Within ${requiredGeofenceDistance}m`,
        [
          { text: "OK", style: "cancel" },
          { text: "Try Anyway", onPress: () => proceedWithAttendance() },
        ]
      );
      return;
    }

    await proceedWithAttendance();
  };

  if (!isLoaded || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}
        >
          <StatusBar barStyle="dark-content" />
          <LottieView
            source={require("../../../assets/loading-animation.json")}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text
            style={{
              marginTop: 16,
              color: colors.text,
              fontSize: 18,
              fontWeight: "600",
              opacity: 0.9,
            }}
            accessibilityLabel="Loading workspace"
          >
            Loading your workspace...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: colors.background,
          }}
        >
          <StatusBar barStyle="dark-content" />
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={colors.primary}
            accessibilityLabel="Authentication required"
          />
          <Text
            style={{
              color: colors.text,
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
              color: colors.subtext,
              fontSize: 16,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Please sign in to continue
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: colors.background,
          }}
        >
          <StatusBar barStyle="dark-content" />
          <Ionicons
            name="warning-outline"
            size={64}
            color={colors.error}
            accessibilityLabel="Error occurred"
          />
          <Text
            style={{
              color: colors.text,
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
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 10,
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
                  backgroundColor: colors.secondary, // Use a slightly different orange
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { distance, office: nearestOffice } = getDistanceToNearestOffice();
  const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000;
  const isWithinRange = distance <= requiredGeofenceDistance;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      {/* Header section - subtle gradient for a touch of warmth */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 16,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 24, // Adjust for Android status bar
          marginBottom: 16,
          borderBottomLeftRadius: 20, // Rounded bottom corners
          borderBottomRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: 4,
              }}
              accessibilityLabel={`Greeting ${user.firstName || "Manager"}`}
            >
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 18
                ? "Afternoon"
                : "Evening"}
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                fontWeight: "500",
              }}
            >
              {user.firstName || "Manager"}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <PulsingDot size={16} color="#ffffff" />
            <Text
              style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}
            >
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Status */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: location ? colors.success : colors.error, // Icon background based on status
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
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
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
            <View style={{ backgroundColor: colors.lightBackground, padding: 16, borderRadius: 12 }}>
              <Text style={{ color: colors.primary, fontSize: 14, marginBottom: 8, fontWeight: '600' }}>
                📍 Current Location
              </Text>
              <Text
                style={{
                  color: colors.subtext,
                  fontSize: 12,
                  fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace",
                }}
              >
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </Text>
              <Text
                style={{
                  color: colors.subtext,
                  fontSize: 12,
                  fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace",
                  marginTop: 4,
                }}
              >
                Accuracy: {location.accuracy !== null ? `${location.accuracy.toFixed(2)}m` : "N/A"}
              </Text>
              <TouchableOpacity
                onPress={getLocation}
                accessibilityLabel="Refresh current location"
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
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
            <View style={{ backgroundColor: '#FCE7E7', padding: 16, borderRadius: 12 }}> {/* Light red background for error */}
              <Text style={{ color: colors.error, fontSize: 14, marginBottom: 8, fontWeight: '600' }}>
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
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
                  Enable Location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Attendance Status */}
        {location && assignedOffices.length > 0 && ( // Ensure offices are loaded before showing this card
          <Card
            style={{
              backgroundColor: isWithinRange ? colors.lightBackground : '#FCE7E7', // Tinted card background
              borderColor: isWithinRange ? colors.success : colors.error,
              borderWidth: 1,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: isWithinRange ? colors.success : colors.error,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name={isWithinRange ? "checkmark-circle" : "warning"}
                  size={36}
                  color="#ffffff"
                  accessibilityLabel={isWithinRange ? "Ready to clock in" : "Out of office range"}
                />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  textAlign: "center",
                }}
              >
                {isWithinRange ? "Ready to Clock In!" : "Move Closer to Office"}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}
              >
                <Text style={{ color: colors.subtext, fontSize: 14 }}>Nearest Office</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  {nearestOffice?.officeName || "N/A"}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}
              >
                <Text style={{ color: colors.subtext, fontSize: 14 }}>Distance</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  {distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.subtext, fontSize: 14 }}>Status</Text>
                <Text style={{ color: isWithinRange ? colors.success : colors.error, fontSize: 14, fontWeight: "600" }}>
                  {isWithinRange ? "Within Range ✅" : "Out of Range ⚠️"}
                </Text>
              </View>
              {!isWithinRange && (
                <Text
                  style={{
                    color: colors.subtext,
                    fontSize: 12,
                    marginTop: 12,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  You need to be within {requiredGeofenceDistance / 1000}km (
                  {requiredGeofenceDistance}m) of your assigned office.
                </Text>
              )}
            </View>
          </Card>
        )}
        {assignedOffices.length === 0 && !loading && !error && (
            <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Ionicons name="alert-circle-outline" size={50} color={colors.warning} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>
                    No offices assigned to your account.
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, marginTop: 5, textAlign: 'center' }}>
                    Please contact your administrator to assign offices.
                </Text>
            </Card>
        )}

        {/* Mark Attendance Button */}
        <TouchableOpacity
          onPress={markAttendance}
          disabled={marking || !location || assignedOffices.length === 0}
          accessibilityLabel="Mark attendance"
          style={{
            backgroundColor: marking
              ? colors.subtext
              : location && assignedOffices.length > 0
              ? colors.primary
              : colors.subtext, // Gray out if not ready
            paddingVertical: 18,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 20,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2, // Softer shadow
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {marking ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "700" }}>
              Mark Attendance
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer info (optional) */}
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={{ color: colors.subtext, fontSize: 12, textAlign: "center" }}>
            Data accurate as of{" "}
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
