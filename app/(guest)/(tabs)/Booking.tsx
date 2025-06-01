import { getVisitRequests, submitFeedback } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface VisitRequest {
  id: string;
  status: string;
  qrCode: string;
  expiresAt: string;
  title: string;
  date: string;
  projectName: string;
  plotNumber: string;
}

export default function BookingsTab() {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Feedback states
  const [rating, setRating] = useState<{ [id: string]: number }>({});
  const [experience, setExperience] = useState<{ [id: string]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [id: string]: string }>({});
  const [purchaseInterest, setPurchaseInterest] = useState<{
    [id: string]: boolean | null;
  }>({});
  const [submitting, setSubmitting] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (!isSignedIn) {
      setError("Please sign in to view your bookings");
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        // Pass the clerkId (userId from Clerk) to get user-specific bookings
        const data = await getVisitRequests(userId);
        setBookings(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bookings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isSignedIn, userId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Updated handleSubmitFeedback function for your React component

const handleSubmitFeedback = async (id: string) => {
  if (!isSignedIn) {
    Alert.alert("Error", "Please sign in to submit feedback");
    return;
  }

  if (!rating[id]) {
    Alert.alert("Error", "Please provide a rating");
    return;
  }

  // Validate required fields
  if (!experience[id]?.trim()) {
    Alert.alert("Error", "Please share your experience");
    return;
  }

  if (!suggestions[id]?.trim()) {
    Alert.alert("Error", "Please provide suggestions");
    return;
  }

  if (purchaseInterest[id] === undefined) {
    Alert.alert("Error", "Please indicate your purchase interest");
    return;
  }

  setSubmitting((prev) => ({ ...prev, [id]: true }));

  try {
    await submitFeedback({
      visitRequestId: id, // ✅ FIXED: Changed from bookingId to visitRequestId
      rating: rating[id],
      experience: experience[id].trim(),
      suggestions: suggestions[id].trim(),
      purchaseInterest: purchaseInterest[id],
      clerkId: userId, // ✅ Pass the clerk user ID from useAuth()
    });

    Alert.alert(
      "Thank You!",
      "Your feedback has been submitted successfully.",
      [
        {
          text: "OK",
          onPress: () => {
            // Reset feedback states for this booking
            setRating((prev) => ({ ...prev, [id]: 0 }));
            setExperience((prev) => ({ ...prev, [id]: "" }));
            setSuggestions((prev) => ({ ...prev, [id]: "" }));
            setPurchaseInterest((prev) => ({ ...prev, [id]: null }));
            setExpandedId(null);
            
            // Optionally refresh the bookings list to show updated status
            // fetchBookings();
          },
        },
      ]
    );
  } catch (error) {
    console.error("Feedback submission error:", error);
    Alert.alert(
      "Error",
      error instanceof Error
        ? error.message
        : "Failed to submit feedback. Please try again."
    );
  } finally {
    setSubmitting((prev) => ({ ...prev, [id]: false }));
  }
};

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-600 text-center mb-4">
          Please sign in to view your bookings
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          className="bg-orange-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fb6e14" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
            getVisitRequests(userId)
              .then(setBookings)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          className="bg-orange-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: VisitRequest }) => {
    const isExpanded = expandedId === item.id;
    const isApproved = item.status === "APPROVED";

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="mb-4"
      >
        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                {item.title}
              </Text>
              <Text className="text-gray-500 mt-1">
                {new Date(item.date).toLocaleString()}
              </Text>
              <Text className="text-sm mt-1 text-gray-700">
                Status: {item.status}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="#666"
            />
          </View>

          {isExpanded && (
            <View className="mt-4">
              {isApproved ? (
                <>
                  <View className="items-center border border-orange-200 rounded-xl p-4 bg-orange-50">
                    <Image
                      source={{ uri: item.qrCode }}
                      className="w-48 h-48 rounded-xl"
                      resizeMode="contain"
                    />
                    <Text className="mt-3 text-orange-700 font-medium">
                      Expires at: {new Date(item.expiresAt).toLocaleString()}
                    </Text>
                  </View>

                  {/* Feedback Form */}
                  <View className="mt-6 bg-white rounded-xl p-4">
                    <Text className="text-xl font-bold text-gray-800 mb-4">
                      Share Your Feedback
                    </Text>

                    {/* Rating */}
                    <View className="mb-6">
                      <Text className="text-base font-medium text-gray-700 mb-2">
                        How would you rate your visit? *
                      </Text>
                      <View className="flex-row justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() =>
                              setRating((prev) => ({
                                ...prev,
                                [item.id]: star,
                              }))
                            }
                            className="p-2"
                          >
                            <Ionicons
                              name={
                                rating[item.id] >= star
                                  ? "star"
                                  : "star-outline"
                              }
                              size={32}
                              color={
                                rating[item.id] >= star ? "#fb6e14" : "#ccc"
                              }
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text className="text-center text-gray-500 mt-2">
                        {rating[item.id] > 0
                          ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                              rating[item.id] - 1
                            ]
                          : "Tap to rate"}
                      </Text>
                    </View>

                    {/* Experience */}
                    <View className="mb-6">
                      <Text className="text-base font-medium text-gray-700 mb-2">
                        Tell us about your experience *
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700"
                        placeholder="What did you like or dislike about the property and your visit?"
                        multiline
                        numberOfLines={4}
                        value={experience[item.id] || ""}
                        onChangeText={(text) =>
                          setExperience((prev) => ({
                            ...prev,
                            [item.id]: text,
                          }))
                        }
                      />
                    </View>

                    {/* Purchase Interest */}
                    <View className="mb-6">
                      <Text className="text-base font-medium text-gray-700 mb-2">
                        Are you interested in purchasing this property? *
                      </Text>
                      <View className="flex-row justify-between">
                        {["Yes", "No", "Maybe"].map((option) => (
                          <TouchableOpacity
                            key={option}
                            onPress={() =>
                              setPurchaseInterest((prev) => ({
                                ...prev,
                                [item.id]:
                                  option === "Yes"
                                    ? true
                                    : option === "No"
                                    ? false
                                    : null,
                              }))
                            }
                            className={`flex-1 mx-1 p-3 rounded-lg border ${
                              purchaseInterest[item.id] ===
                              (option === "Yes"
                                ? true
                                : option === "No"
                                ? false
                                : null)
                                ? "bg-orange-500 border-orange-500"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-center font-medium ${
                                purchaseInterest[item.id] ===
                                (option === "Yes"
                                  ? true
                                  : option === "No"
                                  ? false
                                  : null)
                                  ? "text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Suggestions */}
                    <View className="mb-6">
                      <Text className="text-base font-medium text-gray-700 mb-2">
                        Do you have any suggestions for improvement? *
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700"
                        placeholder="Your suggestions help us improve our services"
                        multiline
                        numberOfLines={4}
                        value={suggestions[item.id] || ""}
                        onChangeText={(text) =>
                          setSuggestions((prev) => ({
                            ...prev,
                            [item.id]: text,
                          }))
                        }
                      />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      disabled={submitting[item.id]}
                      onPress={() => handleSubmitFeedback(item.id)}
                      className={`bg-orange-500 rounded-lg py-3 items-center ${
                        submitting[item.id] ? "opacity-50" : "opacity-100"
                      }`}
                    >
                      <Text className="text-white font-bold text-lg">
                        {submitting[item.id]
                          ? "Submitting..."
                          : "Submit Feedback"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text className="mt-4 text-red-500 font-semibold text-center tracking-wide">
                  QR Code not available. Visit not approved yet.
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
