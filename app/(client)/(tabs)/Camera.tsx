import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const { width: screenWidth } = Dimensions.get("window");

interface Camera {
  id: string;
  landId: string;
  ipAddress: string;
  label: string;
  createdAt: string;
  land?: {
    id: string;
    name: string;
    userId: string;
  };
}

const Camera = () => {
  const { getToken, userId } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [streamingErrors, setStreamingErrors] = useState<{
    [key: string]: boolean;
  }>({});

  const API_BASE_URL = "https://main-admin-dashboard-git-main-realtos-projects.vercel.app";

  const fetchCameras = async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/cameras`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setCameras(data);
        console.log("Fetched cameras:", data);
      } else {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
      Alert.alert(
        "Error",
        "Failed to load cameras. Please check your connection and try again.",
        [{ text: "OK" }, { text: "Retry", onPress: () => fetchCameras() }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCameras();
  };

  const getStreamUrl = (ipAddress: string) => {
    // Clean up the IP address if it already contains http://
    const cleanIpAddress = ipAddress.replace(/^https?:\/\//, "");

    // If the ipAddress already contains the full URL (like your data), use it directly
    if (ipAddress.includes("axis-cgi") || ipAddress.includes("video.cgi")) {
      return ipAddress;
    }

    // Otherwise, construct the URL
    return `http://${cleanIpAddress}/mjpeg/1`;
  };

  const handleStreamError = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: true }));
  };

  const handleStreamLoad = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: false }));
  };

  const CameraCard = ({ camera }: { camera: Camera }) => (
    <View className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden border border-gray-100">
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">
              {camera.label || `Camera ${camera.id.slice(-4)}`}
            </Text>
            <Text className="text-blue-100 text-sm">
              {camera.land?.name || "Unknown Land"} •{" "}
              {camera.ipAddress.replace("http://", "").split("/")[0]}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              setSelectedCamera(
                selectedCamera?.id === camera.id ? null : camera
              )
            }
            className="bg-white/20 rounded-full p-2"
          >
            <Ionicons
              name={selectedCamera?.id === camera.id ? "contract" : "expand"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stream Container */}
      <View className="relative">
        <View
          className="bg-gray-900"
          style={{
            height: selectedCamera?.id === camera.id ? 250 : 200,
            width: "100%",
          }}
        >
          {streamingErrors[camera.id] ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="videocam-off" size={48} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2 text-center px-4">
                Stream unavailable
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setStreamingErrors((prev) => ({
                    ...prev,
                    [camera.id]: false,
                  }));
                }}
                className="bg-blue-500 px-4 py-2 rounded-lg mt-3"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                source={{ uri: getStreamUrl(camera.ipAddress) }}
                style={{ flex: 1 }}
                onError={() => handleStreamError(camera.id)}
                onLoad={() => handleStreamLoad(camera.id)}
                startInLoadingState={true}
                renderLoading={() => (
                  <View className="absolute inset-0 justify-center items-center bg-gray-900">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-white mt-2">Loading stream...</Text>
                  </View>
                )}
                injectedJavaScript={`
                  document.body.style.margin = '0';
                  document.body.style.padding = '0';
                  document.body.style.backgroundColor = '#000';
                  true;
                `}
                scalesPageToFit={true}
                bounces={false}
                scrollEnabled={false}
              />

              {/* Live indicator */}
              <View className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-full flex-row items-center">
                <View className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                <Text className="text-white text-xs font-bold">LIVE</Text>
              </View>
            </>
          )}
        </View>

        {/* Controls */}
        <View className="absolute bottom-3 left-3 right-3">
          <View className="bg-black/50 rounded-lg px-3 py-2 flex-row justify-between items-center">
            <TouchableOpacity className="bg-white/20 rounded-full p-2">
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white/20 rounded-full p-2">
              <Ionicons name="settings" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white/20 rounded-full p-2">
              <Ionicons name="share" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 py-3 bg-gray-50">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            <Text className="text-gray-600 text-sm">Connected</Text>
          </View>
          <Text className="text-gray-400 text-xs">
            Added {new Date(camera.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCameraCard = ({ item: camera }: { item: Camera }) => (
    <CameraCard camera={camera} />
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4 text-lg">Loading cameras...</Text>
      </View>
    );
  }

  if (cameras.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-8 py-20">
          <View className="bg-white rounded-full p-6 mb-6 shadow-sm">
            <Ionicons name="videocam-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            No Cameras Found
          </Text>
          <Text className="text-gray-600 text-center mb-8 leading-6">
            Add cameras to your land properties to start monitoring your areas
            with live video feeds.
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Live Cameras
            </Text>
            <Text className="text-gray-600">
              {cameras.length} camera{cameras.length !== 1 ? "s" : ""} active
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-500 rounded-full p-3"
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="white"
              style={{
                transform: [{ rotate: refreshing ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cameras}
        renderItem={renderCameraCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={<View className="h-8" />}
      />
    </View>
  );
};

export default Camera;
