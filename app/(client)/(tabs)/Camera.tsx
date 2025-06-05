import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ScrollView,
  Image
} from "react-native";
import { WebView } from "react-native-webview";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { getOwnedLands, getCameras } from "@/lib/api";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

interface Land {
  id: string;
  number?: string;
  size?: string;
  status?: string;
  qrCode?: string;
  plot?: {
    id: string;
    title: string;
    location: string;
    imageUrls?: string[];
    project?: {
      id: string;
      name: string;
    };
  };
}

interface Camera {
  id: string;
  landId: string;
  ipAddress: string;
  label: string;
  createdAt: string;
  land?: {
    id: string;
    plot?: {
      title: string;
      location: string;
    };
  };
}

interface Feedback {
  rating: number;
  experience: string;
  suggestions: string;
}

const fadeIn = { from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } };

export default function Camera() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [streamingErrors, setStreamingErrors] = useState<{ [key: string]: boolean }>({});
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ rating: 0, experience: "", suggestions: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);

  const webViewRef = useRef<WebView>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [landsData, camerasData] = await Promise.all([
        getOwnedLands(user.id),
        getCameras(user.id),
      ]);
      
      setLands(landsData);
      setCameras(camerasData);
      
      // Set default selected land if available
      if (landsData.length > 0) {
        setSelectedLand(landsData[0]);
        
        // Find cameras for this land
        const landCameras = camerasData.filter(cam => cam.landId === landsData[0].id);
        if (landCameras.length > 0) {
          setSelectedCamera(landCameras[0]);
        }
      }
    } catch (err) {
      setError("Failed to load cameras or lands.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const getStreamUrl = (ipAddress: string) => {
    // Handle MJPEG streams
    if (ipAddress.includes('mjpg') || ipAddress.includes('MotionJpeg')) {
      return ipAddress;
    }
    
    // Handle other stream types
    return ipAddress;
  };

  const handleStreamError = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: true }));
    setIsStreamActive(false);
  };

  const handleStreamLoad = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: false }));
    setIsStreamActive(true);
  };

  const handleSnapshot = () => {
    setShowSnapshotModal(true);
  };

  const handleRecord = () => {
    setShowRecordModal(true);
  };

  const handleCloudUpload = () => {
    Alert.alert("Cloud Upload", "Video uploaded to the cloud! (Mock)", [{ text: "OK" }]);
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const CameraFeed = ({ camera }: { camera: Camera }) => {
    const land = lands.find(l => l.id === camera.landId);
    const plotTitle = land?.plot?.title || "Unknown Land";
    
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        style={tw`bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-orange-50`}
      >
        <View style={tw`h-56 w-full bg-gray-800`}>
          {streamingErrors[camera.id] ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Ionicons name="videocam-off" size={48} color="#9CA3AF" />
              <Text style={tw`text-gray-400 mt-2 text-center px-4 font-medium`}>Stream unavailable</Text>
              <TouchableOpacity
                onPress={() => setStreamingErrors((prev) => ({ ...prev, [camera.id]: false }))}
                style={tw`bg-orange-600 px-4 py-2 rounded-lg mt-3 active:bg-orange-700`}
              >
                <Text style={tw`text-white font-semibold`}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: getStreamUrl(camera.ipAddress) }}
              style={tw`flex-1`}
              onError={() => handleStreamError(camera.id)}
              onLoad={() => handleStreamLoad(camera.id)}
              startInLoadingState
              renderLoading={() => (
                <View style={tw`absolute inset-0 justify-center items-center`}>
                  <ActivityIndicator size="large" color="#f97316" />
                  <Text style={tw`text-white mt-2 font-medium`}>Loading stream...</Text>
                </View>
              )}
              injectedJavaScript={`
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                document.body.style.backgroundColor = '#1F2937';
                document.documentElement.style.overflow = 'hidden';
                true;
              `}
              scalesPageToFit
              bounces={false}
              scrollEnabled={false}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={false}
              onShouldStartLoadWithRequest={(request) => {
                // Only allow loading of camera stream URLs
                return request.url.startsWith('http');
              }}
            />
          )}
        </View>
        <View style={tw`px-4 py-3`}>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-gray-800 font-bold text-lg flex-1`}>{camera.label}</Text>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-3 h-3 ${streamingErrors[camera.id] ? 'bg-red-500' : 'bg-green-500'} rounded-full mr-2`} />
              <Text style={tw`text-gray-600 text-sm font-medium`}>
                {streamingErrors[camera.id] ? 'Offline' : 'Online'}
              </Text>
            </View>
          </View>
          <Text style={tw`text-gray-600 text-sm font-medium`}>{plotTitle}</Text>
        </View>
      </Animatable.View>
    );
  };

  const PropertyCard = ({ land }: { land: Land }) => {
    const landCameras = cameras.filter((cam) => cam.landId === land.id);
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        style={tw`bg-orange-600 rounded-2xl shadow-sm p-4 mb-4`}
      >
        <Text style={tw`text-white font-bold text-lg tracking-tight`}>{land.plot?.title || "Unknown Plot"}</Text>
        <View style={tw`flex-row items-center mt-1`}>
          <Ionicons name="videocam" size={16} color="white" />
          <Text style={tw`text-orange-100 text-sm font-medium ml-2`}>{landCameras.length} cameras</Text>
        </View>
      </Animatable.View>
    );
  };

  const CameraButton = ({ camera }: { camera: Camera }) => (
    <TouchableOpacity
      onPress={() => setSelectedCamera(camera)}
      style={tw`flex-1 mx-1 py-3 rounded-xl shadow-sm ${selectedCamera?.id === camera.id ? "bg-orange-600" : "bg-white"}`}
    >
      <View style={tw`flex-row items-center justify-center`}>
        <Text
          style={tw`text-center font-medium ${selectedCamera?.id === camera.id ? "text-white" : "text-gray-800"}`}
        >
          {camera.label}
        </Text>
        <View style={tw`w-3 h-3 ${streamingErrors[camera.id] ? 'bg-red-500' : 'bg-green-500'} rounded-full ml-2`} />
      </View>
      <Text
        style={tw`text-center text-sm font-medium ${selectedCamera?.id === camera.id ? "text-orange-100" : "text-gray-600"}`}
      >
        {streamingErrors[camera.id] ? 'Offline' : 'Online'}
      </Text>
    </TouchableOpacity>
  );

  // ... Rest of the modal components remain the same

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Animatable.View animation={fadeIn} duration={800}>
          <Ionicons name="videocam-outline" size={48} color="#f97316" />
          <Text style={tw`text-gray-600 mt-3 text-base font-medium`}>Loading cameras...</Text>
        </Animatable.View>
      </View>
    );
  }

  if (error || (!cameras.length && !lands.length)) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Animatable.View animation={fadeIn} duration={1000}>
          <Text style={tw`text-red-500 text-lg font-medium text-center`}>{error || "No cameras or lands found"}</Text>
          <TouchableOpacity
            style={tw`mt-6 bg-orange-600 px-6 py-3 rounded-xl shadow-sm active:bg-orange-700`}
            onPress={onRefresh}
          >
            <Text style={tw`text-white font-semibold text-center`}>Retry</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1 bg-gray-50`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
    >
      <View style={tw`bg-orange-600 pt-12 pb-6 px-5 shadow-lg flex-row items-center`}>
        <TouchableOpacity
          style={tw`p-2 rounded-full bg-orange-700/20 active:bg-orange-700/40`}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Animatable.Text
          animation={fadeIn}
          duration={1000}
          style={tw`text-white text-2xl font-bold ml-4 tracking-tight`}
        >
          Live Camera Feed
        </Animatable.Text>
      </View>

      <View style={tw`px-5 py-6`}>
        {selectedCamera && <CameraFeed camera={selectedCamera} />}
        
        {lands.length > 0 && (
          <>
            <Text style={tw`text-lg font-bold text-gray-800 mb-3 tracking-tight`}>Properties & Cameras</Text>
            {selectedLand && <PropertyCard land={selectedLand} />}
          </>
        )}
        
        {cameras.filter(cam => cam.landId === selectedLand?.id).length > 0 && (
          <View style={tw`flex-row mb-4`}>
            {cameras
              .filter((cam) => cam.landId === selectedLand?.id)
              .map((camera) => (
                <CameraButton key={camera.id} camera={camera} />
              ))}
          </View>
        )}
        
        {isStreamActive && (
          <View style={tw`flex-row justify-between mt-4`}>
            <TouchableOpacity
              onPress={handleSnapshot}
              style={tw`bg-orange-600 rounded-xl p-4 shadow-sm active:bg-orange-700`}
            >
              <Ionicons name="camera" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRecord}
              style={tw`bg-orange-600 rounded-xl p-4 shadow-sm active:bg-orange-700`}
            >
              <Ionicons name={isRecording ? "stop-circle" : "recording"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCloudUpload}
              style={tw`bg-orange-600 rounded-xl p-4 shadow-sm active:bg-orange-700`}
            >
              <Ionicons name="cloud-upload" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSettings}
              style={tw`bg-orange-600 rounded-xl p-4 shadow-sm active:bg-orange-700`}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

    
    </ScrollView>
  );
}