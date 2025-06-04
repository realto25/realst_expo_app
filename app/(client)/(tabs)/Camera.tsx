import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Animatable from "react-native-animatable";

const { width: screenWidth } = Dimensions.get("window");

interface Land {
  id: string;
  name: string;
}

interface Camera {
  id: string;
  landId: string;
  ipAddress: string;
  label: string;
  createdAt: string;
  land?: Land;
}

interface Feedback {
  rating: number;
  experience: string;
  suggestions: string;
}

// Mock data for UI/UX purposes
const MOCK_LANDS: Land[] = [
  { id: "1", name: "Premium Villa Plot A-123" },
  { id: "2", name: "Plot B" },
  { id: "3", name: "Plot C" },
  { id: "4", name: "Plot D" },
];

const MOCK_CAMERAS: Camera[] = [
  {
    id: "1",
    landId: "1",
    ipAddress: "http://213.236.250.78/mjpg/video.mjpg",
    label: "Main Entrance",
    createdAt: "2025-06-04T17:26:55.489Z",
    land: MOCK_LANDS[0],
  },
  {
    id: "2",
    landId: "1",
    ipAddress: "http://213.236.250.78/mjpg/video.mjpg",
    label: "Back Side",
    createdAt: "2025-06-04T13:23:09.795Z",
    land: MOCK_LANDS[0],
  },
  {
    id: "3",
    landId: "3",
    ipAddress: "http://213.236.250.78/mjpg/video.mjpg",
    label: "Entrance",
    createdAt: "2025-06-04T13:22:24.674Z",
    land: MOCK_LANDS[2],
  },
];

const Camera = () => {
  const [cameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [lands] = useState<Land[]>(MOCK_LANDS);
  const [selectedLand, setSelectedLand] = useState<Land | null>(MOCK_LANDS[0]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(MOCK_CAMERAS[0]);
  const [streamingErrors, setStreamingErrors] = useState<{ [key: string]: boolean }>({});
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ rating: 0, experience: "", suggestions: "" });

  const webViewRef = useRef<WebView>(null);

  const getStreamUrl = (ipAddress: string) => ipAddress;

  const handleStreamError = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: true }));
  };

  const handleStreamLoad = (cameraId: string) => {
    setStreamingErrors((prev) => ({ ...prev, [cameraId]: false }));
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

  const handleFeedbackSubmit = () => {
    setShowFeedbackModal(false);
    setFeedback({ rating: 0, experience: "", suggestions: "" });
  };

  const CameraFeed = ({ camera }: { camera: Camera }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden"
    >
      <View style={{ height: 220, width: "100%" }}>
        {streamingErrors[camera.id] ? (
          <View className="flex-1 justify-center items-center bg-gray-800">
            <Ionicons name="videocam-off" size={48} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2 text-center px-4 font-sans">
              Stream unavailable
            </Text>
            <TouchableOpacity
              onPress={() => setStreamingErrors((prev) => ({ ...prev, [camera.id]: false }))}
              className="bg-orange-500 px-4 py-2 rounded-lg mt-3"
            >
              <Text className="text-white font-medium font-sans">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: getStreamUrl(camera.ipAddress) }}
            style={{ flex: 1 }}
            onError={() => handleStreamError(camera.id)}
            onLoad={() => handleStreamLoad(camera.id)}
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 justify-center items-center bg-gray-900">
                <ActivityIndicator size="large" color="#F5A623" />
                <Text className="text-white mt-2 font-sans">Loading stream...</Text>
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
          />
        )}
      </View>
      <View className="px-4 py-3">
        <View className="flex-row items-center">
          <Text className="text-gray-800 font-bold text-lg font-sans flex-1">
            {camera.label}
          </Text>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <Text className="text-gray-600 text-sm font-sans">Online</Text>
          </View>
        </View>
        <Text className="text-gray-600 text-sm font-sans">{camera.land?.name}</Text>
      </View>
    </Animatable.View>
  );

  const PropertyCard = ({ land }: { land: Land }) => {
    const landCameras = cameras.filter((cam) => cam.landId === land.id);
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-sm p-4 mb-4"
      >
        <Text className="text-white font-bold text-lg font-sans">{land.name}</Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="videocam" size={16} color="white" />
          <Text className="text-white text-sm font-sans ml-2">
            {landCameras.length} cameras
          </Text>
        </View>
      </Animatable.View>
    );
  };

  const CameraButton = ({ camera }: { camera: Camera }) => (
    <TouchableOpacity
      onPress={() => setSelectedCamera(camera)}
      className={`flex-1 mx-1 py-3 rounded-xl shadow-sm ${
        selectedCamera?.id === camera.id
          ? "bg-gradient-to-r from-orange-500 to-orange-400"
          : "bg-white"
      }`}
    >
      <View className="flex-row items-center justify-center">
        <Text
          className={`text-center font-sans font-medium ${
            selectedCamera?.id === camera.id ? "text-white" : "text-gray-800"
          }`}
        >
          {camera.label}
        </Text>
        <View className="w-3 h-3 bg-green-500 rounded-full ml-2" />
      </View>
      <Text
        className={`text-center text-sm font-sans ${
          selectedCamera?.id === camera.id ? "text-orange-100" : "text-gray-600"
        }`}
      >
        Online
      </Text>
    </TouchableOpacity>
  );

  // Modals
  const SnapshotModal = () => (
    <Modal visible={showSnapshotModal} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60">
        <Animatable.View
          animation="zoomIn"
          duration={300}
          className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
        >
          <Text className="text-xl font-bold text-gray-800 mb-4 font-sans">
            Take Snapshot
          </Text>
          <Text className="text-gray-600 mb-6 font-sans">
            Capture a snapshot from {selectedCamera?.label || "the camera"}?
          </Text>
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
              onPress={() => setShowSnapshotModal(false)}
              className="px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-600 font-sans">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSnapshotModal(false);
                setShowFeedbackModal(true);
              }}
              className="bg-orange-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium font-sans">Capture</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  const RecordModal = () => (
    <Modal visible={showRecordModal} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60">
        <Animatable.View
          animation="zoomIn"
          duration={300}
          className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
        >
          <Text className="text-xl font-bold text-gray-800 mb-4 font-sans">
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
          <Text className="text-gray-600 mb-6 font-sans">
            {isRecording
              ? `Stop recording from ${selectedCamera?.label || "the camera"}?`
              : `Start recording from ${selectedCamera?.label || "the camera"}?`}
          </Text>
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
              onPress={() => setShowRecordModal(false)}
              className="px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-600 font-sans">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsRecording(!isRecording);
                setShowRecordModal(false);
                setShowFeedbackModal(true);
              }}
              className="bg-orange-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium font-sans">
                {isRecording ? "Stop" : "Start"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  const FeedbackModal = () => (
    <Modal visible={showFeedbackModal} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60">
        <Animatable.View
          animation="zoomIn"
          duration={300}
          className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
        >
          <Text className="text-xl font-bold text-gray-800 mb-4 font-sans">
            Provide Feedback
          </Text>
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-sans">Rating</Text>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setFeedback((prev) => ({ ...prev, rating: star }))}
                >
                  <Ionicons
                    name={star <= feedback.rating ? "star" : "star-outline"}
                    size={24}
                    color="#F5A623"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-sans">Experience</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-gray-800 font-sans bg-orange-50"
              placeholder="Share your experience..."
              value={feedback.experience}
              onChangeText={(text) => setFeedback((prev) => ({ ...prev, experience: text }))}
              multiline
            />
          </View>
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-sans">Suggestions</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-gray-800 font-sans bg-orange-50"
              placeholder="Any suggestions?"
              value={feedback.suggestions}
              onChangeText={(text) => setFeedback((prev) => ({ ...prev, suggestions: text }))}
              multiline
            />
          </View>
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
              onPress={() => setShowFeedbackModal(false)}
              className="px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-600 font-sans">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFeedbackSubmit}
              className="bg-orange-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium font-sans">Submit</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  const SettingsModal = () => (
    <Modal visible={showSettingsModal} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60">
        <Animatable.View
          animation="zoomIn"
          duration={300}
          className="bg-white rounded-2xl p-6 w-11/12 max-w-md"
        >
          <Text className="text-xl font-bold text-gray-800 mb-4 font-sans">
            Camera Settings
          </Text>
          <Text className="text-gray-600 mb-6 font-sans">
            Adjust settings for {selectedCamera?.label || "the camera"}.
          </Text>
          {/* Placeholder for settings options */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-sans">Quality</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-gray-800 font-sans bg-orange-50"
              placeholder="e.g., High"
              value="High"
              editable={false}
            />
          </View>
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              className="px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-600 font-sans">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSettingsModal(false);
                Alert.alert("Settings", "Settings saved! (Mock)", [{ text: "OK" }]);
              }}
              className="bg-orange-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium font-sans">Save</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 pb-4 px-5 flex-row items-center">
        <TouchableOpacity className="p-2">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-800 font-sans">
          Live Camera Feed
        </Text>
        <View className="w-10" /> {/* Spacer for centering */}
      </View>

      {/* Main Content */}
      <View className="flex-1 px-5">
        {/* Camera Feed */}
        {selectedCamera && <CameraFeed camera={selectedCamera} />}

        {/* Properties & Cameras */}
        <Text className="text-lg font-bold text-gray-800 mb-3 font-sans">
          Properties & Cameras
        </Text>
        {selectedLand && <PropertyCard land={selectedLand} />}
        <View className="flex-row mb-4">
          {cameras
            .filter((cam) => cam.landId === selectedLand?.id)
            .map((camera) => (
              <CameraButton key={camera.id} camera={camera} />
            ))}
        </View>

        {/* Controls */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={handleSnapshot}
            className="bg-orange-500 rounded-xl p-4 shadow-sm"
          >
            <Ionicons name="camera" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRecord}
            className="bg-orange-600 rounded-xl p-4 shadow-sm"
          >
            <Ionicons
              name={isRecording ? "stop-circle" : "recording"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCloudUpload}
            className="bg-orange-400 rounded-xl p-4 shadow-sm"
          >
            <Ionicons name="cloud-upload" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSettings}
            className="bg-orange-300 rounded-xl p-4 shadow-sm"
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <SnapshotModal />
      <RecordModal />
      <FeedbackModal />
      <SettingsModal />
    </View>
  );
};

export default Camera;
