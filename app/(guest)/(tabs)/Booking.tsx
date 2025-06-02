import { getVisitRequests, submitFeedback, VisitRequest as ApiVisitRequest } from "@/lib/api";
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
  SafeAreaView, // Import SafeAreaView
} from "react-native";

// Use the VisitRequest type directly from the API client for consistency
interface VisitRequest extends ApiVisitRequest {}

export default function BookingsTab() {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Feedback states, now tracking per booking ID
  const [rating, setRating] = useState<{ [id: string]: number }>({});
  const [experience, setExperience] = useState<{ [id: string]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [id: string]: string }>({});
  const [purchaseInterest, setPurchaseInterest] = useState<{
    [id: string]: boolean | null;
  }>({});
  const [submitting, setSubmitting] = useState<{ [id: string]: boolean }>({});
  // New state to track if feedback has been submitted for a booking
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<{ [id: string]: boolean }>({});

  // Function to fetch bookings
  const fetchBookings = async () => {
    if (!isSignedIn) {
      setError("Please sign in to view your bookings");
      setLoading(false);
      return;
    }
    setLoading(true); // Set loading to true before fetching
    setError(null); // Clear previous errors
    try {
      const data = await getVisitRequests(userId);
      setBookings(data);
      // Initialize feedbackSubmitted state based on existing feedback (if backend provided this info)
      // For now, we'll assume feedback is not submitted until user submits it.
      // In a real app, you might fetch feedback status along with bookings.
      const initialFeedbackStatus: { [key: string]: boolean } = {};
      data.forEach(booking => {
        // This is a placeholder. In a real app, your backend would tell you if feedback exists.
        // For demonstration, we'll assume feedback is not submitted initially.
        initialFeedbackStatus[booking.id] = false;
      });
      setFeedbackSubmitted(initialFeedbackStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isSignedIn, userId]); // Re-fetch when sign-in status or userId changes

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSubmitFeedback = async (id: string) => {
    if (!isSignedIn) {
      Alert.alert("Error", "Please sign in to submit feedback");
      return;
    }

    // Basic validation
    if (!rating[id] || rating[id] < 1 || rating[id] > 5) {
      Alert.alert("Error", "Please provide a rating (1-5 stars)");
      return;
    }
    if (!experience[id]?.trim()) {
      Alert.alert("Error", "Please share your experience");
      return;
    }
    if (!suggestions[id]?.trim()) {
      Alert.alert("Error", "Please provide suggestions for improvement");
      return;
    }
    if (purchaseInterest[id] === undefined || purchaseInterest[id] === null) {
      Alert.alert("Error", "Please indicate your purchase interest");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [id]: true }));

    try {
      await submitFeedback({
        visitRequestId: id,
        rating: rating[id],
        experience: experience[id].trim(),
        suggestions: suggestions[id].trim(),
        purchaseInterest: purchaseInterest[id],
        clerkId: userId!, // userId is guaranteed to be present if isSignedIn is true
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
              setExpandedId(null); // Collapse the feedback form
              setFeedbackSubmitted((prev) => ({ ...prev, [id]: true })); // Mark as submitted
              // Optionally re-fetch bookings if the backend updates a 'feedback_submitted' flag
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

  // Render content based on authentication, loading, and error states
  let content;

  if (!isSignedIn) {
    content = (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="person-circle-outline" size={80} color="#9ca3af" />
        <Text className="text-gray-600 text-center text-lg font-medium mb-4 mt-2">
          Please sign in to view your bookings.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          className="bg-orange-500 px-8 py-4 rounded-full shadow-md active:bg-orange-600"
        >
          <Text className="text-white font-bold text-base">Sign In Now</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (loading) {
    content = (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fb6e14" />
        <Text className="mt-4 text-gray-600 text-base">Loading your bookings...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
        <Text className="text-red-600 text-center text-lg font-medium mb-4 mt-2">
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchBookings} // Use the dedicated fetch function
          className="bg-orange-500 px-8 py-4 rounded-full shadow-md active:bg-orange-600"
        >
          <Text className="text-white font-bold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (bookings.length === 0) {
    content = (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="calendar-outline" size={80} color="#9ca3af" />
        <Text className="text-gray-600 text-center text-lg font-medium mb-4 mt-2">
          You don't have any upcoming visit requests yet.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/explore")} // Navigate to explore tab
          className="bg-orange-500 px-8 py-4 rounded-full shadow-md active:bg-orange-600"
        >
          <Text className="text-white font-bold text-base">Book a Visit</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isApproved = item.status === "APPROVED";
          const hasFeedbackBeenSubmitted = feedbackSubmitted[item.id];

          // Format date and time - Added robust parsing and fallback
          let formattedDate = 'N/A';
          let formattedTime = 'N/A';
          const visitDateTime = new Date(`${item.date}T${item.time}`);
          if (!isNaN(visitDateTime.getTime())) { // Check if date is valid
            formattedDate = visitDateTime.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            formattedTime = visitDateTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          } else {
            console.warn(`Invalid date/time for booking ID ${item.id}: Date=${item.date}, Time=${item.time}`);
            // Fallback to raw values if parsing fails
            formattedDate = item.date || 'Invalid Date';
            formattedTime = item.time || 'Invalid Time';
          }

          const expiresAtDate = item.expiresAt ? new Date(item.expiresAt) : null;
          const isQrCodeExpired = expiresAtDate ? expiresAtDate < new Date() : false;

          // Determine status badge color
          let statusColor = "bg-gray-200 text-gray-700";
          if (item.status === "APPROVED") {
            statusColor = "bg-green-100 text-green-700";
          } else if (item.status === "PENDING") {
            statusColor = "bg-yellow-100 text-yellow-700";
          } else if (item.status === "REJECTED") {
            statusColor = "bg-red-100 text-red-700";
          } else if (item.status === "COMPLETED") {
            statusColor = "bg-blue-100 text-blue-700";
          }

          return (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="mb-4"
            >
              <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                className="bg-white rounded-xl shadow-md p-4 border border-gray-100"
                activeOpacity={0.8}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-800 mb-1">
                      {item.plot.title}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">
                      Project: {item.plot.project.name}
                    </Text>
                    <Text className="text-gray-500 text-sm mb-2">
                      Location: {item.plot.location}
                    </Text>
                    <Text className="text-base font-medium text-gray-700">
                      Date: {formattedDate} at {formattedTime}
                    </Text>
                    <View className={`mt-2 px-3 py-1 rounded-full self-start ${statusColor}`}>
                      <Text className={`text-xs font-semibold ${statusColor.includes('green') ? 'text-green-700' : statusColor.includes('yellow') ? 'text-yellow-700' : statusColor.includes('red') ? 'text-red-700' : statusColor.includes('blue') ? 'text-blue-700' : 'text-gray-700'}`}>
                        Status: {item.status}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#666"
                  />
                </View>

                {isExpanded && (
                  <View className="mt-4 border-t border-gray-100 pt-4">
                    {isApproved ? (
                      <>
                        <View className="items-center border border-orange-200 rounded-xl p-4 bg-orange-50 mb-6">
                          <Text className="text-lg font-semibold text-orange-800 mb-3">
                            Your Visit QR Code
                          </Text>
                          {item.qrCode ? (
                            <>
                              <Image
                                source={{ uri: item.qrCode }}
                                className="w-52 h-52 rounded-xl border border-orange-300"
                                resizeMode="contain"
                              />
                              <Text className="mt-3 text-orange-700 font-medium text-center">
                                Expires at: {expiresAtDate && !isNaN(expiresAtDate.getTime()) ? expiresAtDate.toLocaleString() : 'N/A'}
                              </Text>
                              {isQrCodeExpired && (
                                <Text className="text-red-500 font-semibold mt-2 text-center">
                                  This QR code has expired.
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text className="text-red-500 font-semibold text-center">
                              QR Code not available.
                            </Text>
                          )}
                        </View>

                        {/* Feedback Form */}
                        <View className="mt-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Share Your Feedback
                          </Text>

                          {hasFeedbackBeenSubmitted ? (
                            <View className="flex-row items-center justify-center py-4 bg-green-50 rounded-lg">
                              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                              <Text className="text-green-700 font-semibold ml-2 text-base">
                                Feedback already submitted for this visit!
                              </Text>
                            </View>
                          ) : (
                            <>
                              {/* Rating */}
                              <View className="mb-6">
                                <Text className="text-base font-medium text-gray-700 mb-2">
                                  How would you rate your visit? <Text className="text-red-500">*</Text>
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
                                        size={36}
                                        color={
                                          rating[item.id] >= star ? "#fb6e14" : "#ccc"
                                        }
                                      />
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text className="text-center text-gray-500 mt-2 text-sm">
                                  {rating[item.id] > 0
                                    ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                                        rating[item.id] - 1
                                      ]
                                    : "Tap to rate your experience"}
                                </Text>
                              </View>

                              {/* Experience */}
                              <View className="mb-6">
                                <Text className="text-base font-medium text-gray-700 mb-2">
                                  Tell us about your experience <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 min-h-[100px] text-base"
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
                                  style={{ textAlignVertical: 'top' }} // Ensures text starts from top
                                />
                              </View>

                              {/* Suggestions */}
                              <View className="mb-6">
                                <Text className="text-base font-medium text-gray-700 mb-2">
                                  Do you have any suggestions for improvement? <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 min-h-[100px] text-base"
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
                                  style={{ textAlignVertical: 'top' }} // Ensures text starts from top
                                />
                              </View>

                              {/* Purchase Interest */}
                              <View className="mb-8">
                                <Text className="text-base font-medium text-gray-700 mb-2">
                                  Are you interested in purchasing this property? <Text className="text-red-500">*</Text>
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
                                          ? "bg-orange-500 border-orange-500 shadow-sm"
                                          : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <Text
                                        className={`text-center font-medium text-base ${
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

                              {/* Submit Button */}
                              <TouchableOpacity
                                disabled={submitting[item.id]}
                                onPress={() => handleSubmitFeedback(item.id)}
                                className={`bg-orange-500 rounded-lg py-3 items-center shadow-md ${
                                  submitting[item.id] ? "opacity-50" : "opacity-100"
                                }`}
                              >
                                {submitting[item.id] ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <Text className="text-white font-bold text-lg">
                                    Submit Feedback
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </>
                    ) : (
                      <View className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <Text className="text-blue-700 font-semibold text-center text-base tracking-wide">
                          QR Code will be available once your visit request is approved.
                        </Text>
                        <Text className="text-blue-600 text-center text-sm mt-2">
                          Please check back later or contact support if you have questions.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {content}
    </SafeAreaView>
  );
}
