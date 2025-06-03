// app/(tabs)/booking.tsx
import { getVisitRequests, submitFeedback, VisitRequest as ApiVisitRequest } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Types
interface VisitRequest extends ApiVisitRequest {}

const Booking: React.FC = () => {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<string, FeedbackState>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  interface FeedbackState {
    rating: number;
    experience: string;
    suggestions: string;
    purchaseInterest: boolean | null;
    submitted: boolean;
  }

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!isSignedIn) {
      setError("Please sign in to view your bookings");
      setLoading(false);
      return;
    }
    if (!isOnline) {
      setError("No internet connection. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getVisitRequests(userId!);
      setBookings(data);
      setFeedbackData(
        data.reduce((acc, booking) => {
          acc[booking.id] = {
            rating: 0,
            experience: "",
            suggestions: "",
            purchaseInterest: null,
            submitted: false,
          };
          return acc;
        }, {} as Record<string, FeedbackState>)
      );
      setError(null);
    } catch (err) {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, userId, isOnline]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  // Handle feedback submission
  const handleSubmitFeedback = useCallback(
    async (id: string) => {
      if (!isSignedIn) {
        Alert.alert("Error", "Please sign in to submit feedback");
        return;
      }
      if (!isOnline) {
        Alert.alert("Error", "No internet connection. Please try again later.");
        return;
      }

      const { rating, experience, suggestions, purchaseInterest } = feedbackData[id];

      if (rating < 1 || rating > 5 || !experience.trim() || !suggestions.trim() || purchaseInterest === null) {
        Alert.alert("Error", "Please complete all feedback fields");
        return;
      }

      setSubmitting((prev) => ({ ...prev, [id]: true }));

      try {
        await submitFeedback({
          visitRequestId: id,
          rating,
          experience: experience.trim(),
          suggestions: suggestions.trim(),
          purchaseInterest,
          clerkId: userId!,
        });

        Alert.alert("Success", "Your feedback has been submitted successfully.");
        setFeedbackData((prev) => ({
          ...prev,
          [id]: { ...prev[id], submitted: true },
        }));
        setExpandedId(null);
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to submit feedback. Please try again.");
      } finally {
        setSubmitting((prev) => ({ ...prev, [id]: false }));
      }
    },
    [isSignedIn, userId, feedbackData, isOnline]
  );

  // Handle cancel visit
  const handleCancelVisit = useCallback(
    async (id: string) => {
      if (!isOnline) {
        Alert.alert("Error", "No internet connection. Please try again later.");
        return;
      }

      Alert.alert(
        "Cancel Visit",
        "Are you sure you want to cancel this visit?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              try {
                // Replace with actual API call when available
                // await api.delete(`/visit-requests/${id}`);
                setBookings((prev) => prev.filter((booking) => booking.id !== id));
                Alert.alert("Success", "Visit request cancelled successfully.");
              } catch (error: any) {
                Alert.alert("Error", "Failed to cancel visit. Please try again.");
              }
            },
          },
        ]
      );
    },
    [isOnline]
  );

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Optimize FlatList rendering
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 120,
      offset: 120 * index,
      index,
    }),
    []
  );

  // Render content
  const content = useMemo(() => {
    if (!isSignedIn) {
      return (
        <EmptyState
          title="Please sign in to view your bookings."
          iconName="person-circle-outline"
          buttonText="Sign In Now"
          onPress={() => router.push("/(auth)/sign-in")}
        />
      );
    }

    if (loading) {
      return <LoadingState message="Loading your bookings..." />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={fetchBookings} />;
    }

    if (bookings.length === 0) {
      return (
        <EmptyState
          title="You don't have any upcoming visit requests yet."
          iconName="calendar-outline"
          buttonText="Book a Visit"
          onPress={() => router.push("/(tabs)/explore")}
        />
      );
    }

    return (
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingItem
            item={item}
            expandedId={expandedId}
            toggleExpand={() =>
              setExpandedId((prev) => (prev === item.id ? null : item.id))
            }
            feedbackData={feedbackData[item.id]}
            setFeedbackData={(data) =>
              setFeedbackData((prev) => ({
                ...prev,
                [item.id]: { ...prev[item.id], ...data },
              }))
            }
            submitting={submitting[item.id]}
            handleSubmitFeedback={() => handleSubmitFeedback(item.id)}
            handleCancelVisit={() => handleCancelVisit(item.id)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fb6e14" />
        }
        getItemLayout={getItemLayout}
      />
    );
  }, [
    isSignedIn,
    loading,
    error,
    bookings,
    expandedId,
    feedbackData,
    submitting,
    refreshing,
    onRefresh,
    handleSubmitFeedback,
    handleCancelVisit,
    insets.bottom,
    router,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {content}
    </SafeAreaView>
  );
};

// Components
const EmptyState: React.FC<{
  title: string;
  iconName: string;
  buttonText: string;
  onPress: () => void;
}> = ({ title, iconName, buttonText, onPress }) => (
  <View style={styles.emptyState}>
    <Ionicons name={iconName} size={80} color="#6B7280" />
    <Text style={styles.emptyStateText}>{title}</Text>
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessibilityLabel={buttonText}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  </View>
);

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color="#fb6e14" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.errorState}>
    <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity
      onPress={onRetry}
      style={styles.button}
      accessibilityLabel="Retry loading bookings"
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const BookingItem: React.FC<{
  item: VisitRequest;
  expandedId: string | null;
  toggleExpand: () => void;
  feedbackData: FeedbackState;
  setFeedbackData: (data: Partial<FeedbackState>) => void;
  submitting: boolean | undefined;
  handleSubmitFeedback: () => void;
  handleCancelVisit: () => void;
}> = React.memo(({ item, expandedId, toggleExpand, feedbackData, setFeedbackData, submitting, handleSubmitFeedback, handleCancelVisit }) => {
  const isExpanded = expandedId === item.id;
  const isApproved = item.status === "APPROVED";
  const { rating, experience, suggestions, purchaseInterest, submitted } = feedbackData;

  // Date and time formatting
  const visitDateTime = new Date(`${item.date}T${item.time}`);
  const formattedDate = visitDateTime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = visitDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.bookingContainer}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.bookingHeader}
        accessibilityLabel={`Expand booking details for ${item.plot.title}`}
        accessibilityRole="button"
      >
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle}>{item.plot.title}</Text>
          <Text style={styles.bookingSubTitle}>Project: {item.plot.project.name}</Text>
          <Text style={styles.bookingSubTitle}>Location: {item.plot.location}</Text>
          <Text style={styles.bookingDate}>Date: {formattedDate} at {formattedTime}</Text>
          <View style={[styles.statusBadge, getStatusColor(item.status)]}>
            <Text style={styles.statusText}>Status: {item.status}</Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#666"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedSection}>
          {isApproved ? (
            <QrCodeSection item={item} />
          ) : (
            <PendingApproval />
          )}
          {item.status === "PENDING" && (
            <TouchableOpacity
              onPress={handleCancelVisit}
              style={styles.cancelButton}
              accessibilityLabel="Cancel this visit request"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel Visit</Text>
            </TouchableOpacity>
          )}
          <FeedbackForm
            feedbackData={feedbackData}
            setFeedbackData={setFeedbackData}
            submitting={submitting}
            handleSubmitFeedback={handleSubmitFeedback}
            submitted={submitted}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
});

const QrCodeSection: React.FC<{ item: VisitRequest }> = ({ item }) => {
  const expiresAtDate = item.expiresAt ? new Date(item.expiresAt) : null;
  const isQrCodeExpired = expiresAtDate ? expiresAtDate < new Date() : false;
  // Use visit request ID as QR code value to avoid data size issue
  const qrCodeValue = item.id; // e.g., "cmbdvotg10002ji04h71i5x2x"

  return (
    <View style={styles.qrCodeSection}>
      <Text style={styles.qrCodeTitle}>Your Visit QR Code</Text>
      {qrCodeValue ? (
        <>
          <QRCode
            value={qrCodeValue}
            size={200}
            backgroundColor="#fff7ed"
            color="#1F2937"
          />
          <Text style={styles.qrCodeExpiry}>
            Expires at: {expiresAtDate && !isNaN(expiresAtDate.getTime()) ? expiresAtDate.toLocaleString() : "N/A"}
          </Text>
          {isQrCodeExpired && (
            <Text style={styles.qrCodeExpired}>This QR code has expired.</Text>
          )}
        </>
      ) : (
        <Text style={styles.qrCodeNotAvailable}>QR Code not available.</Text>
      )}
    </View>
  );
};

const PendingApproval: React.FC = () => (
  <View style={styles.pendingApproval}>
    <Text style={styles.pendingApprovalText}>
      QR Code will be available once your visit request is approved.
    </Text>
    <Text style={styles.pendingApprovalDescription}>
      Please check back later or contact support if you have questions.
    </Text>
  </View>
);

const FeedbackForm: React.FC<{
  feedbackData: FeedbackState;
  setFeedbackData: (data: Partial<FeedbackState>) => void;
  submitting: boolean | undefined;
  handleSubmitFeedback: () => void;
  submitted: boolean;
}> = ({ feedbackData, setFeedbackData, submitting, handleSubmitFeedback, submitted }) => {
  const { rating, experience, suggestions, purchaseInterest } = feedbackData;

  if (submitted) {
    return (
      <View style={styles.feedbackSubmitted}>
        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
        <Text style={styles.feedbackSubmittedText}>
          Feedback already submitted for this visit!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.feedbackForm}>
      <Text style={styles.feedbackFormTitle}>Share Your Feedback</Text>
      <RatingSection rating={rating} setRating={(value) => setFeedbackData({ rating: value })} />
      <TextInputSection
        label="Tell us about your experience"
        value={experience}
        onChangeText={(text) => setFeedbackData({ experience: text })}
      />
      <TextInputSection
        label="Do you have any suggestions for improvement?"
        value={suggestions}
        onChangeText={(text) => setFeedbackData({ suggestions: text })}
      />
      <PurchaseInterest
        value={purchaseInterest}
        setPurchaseInterest={(value) => setFeedbackData({ purchaseInterest: value })}
      />
      <SubmitButton submitting={submitting} onPress={handleSubmitFeedback} />
    </View>
  );
};

const RatingSection: React.FC<{ rating: number; setRating: (value: number) => void }> = ({ rating, setRating }) => (
  <View style={styles.ratingSection}>
    <Text style={styles.sectionLabel}>
      How would you rate your visit? <Text style={styles.required}>*</Text>
    </Text>
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
          accessibilityLabel={`Rate ${star} stars`}
          accessibilityRole="button"
        >
          <Ionicons
            name={rating >= star ? "star" : "star-outline"}
            size={36}
            color={rating >= star ? "#fb6e14" : "#ccc"}
          />
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.ratingDescription}>
      {rating > 0 ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1] : "Tap to rate your experience"}
    </Text>
  </View>
);

const TextInputSection: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ label, value, onChangeText }) => (
  <View style={styles.textInputSection}>
    <Text style={styles.sectionLabel}>
      {label} <Text style={styles.required}>*</Text>
    </Text>
    <TextInput
      style={styles.textInput}
      placeholder="Your thoughts..."
      placeholderTextColor="#6B7280"
      multiline
      numberOfLines={4}
      value={value || ""}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      accessibilityRole="text"
    />
  </View>
);

const PurchaseInterest: React.FC<{
  value: boolean | null;
  setPurchaseInterest: (value: boolean | null) => void;
}> = ({ value, setPurchaseInterest }) => (
  <View style={styles.purchaseInterest}>
    <Text style={styles.sectionLabel}>
      Are you interested in purchasing this property? <Text style={styles.required}>*</Text>
    </Text>
    <View style={styles.purchaseButtons}>
      {["Yes", "No", "Maybe"].map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => setPurchaseInterest(option === "Yes" ? true : option === "No" ? false : null)}
          style={[styles.purchaseButton, value === (option === "Yes" ? true : option === "No" ? false : null) ? styles.activePurchaseButton : null]}
          accessibilityLabel={`Select ${option} for purchase interest`}
          accessibilityRole="button"
        >
          <Text
            style={[styles.purchaseButtonText, value === (option === "Yes" ? true : option === "No" ? false : null) ? styles.activePurchaseButtonText : null]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SubmitButton: React.FC<{ submitting: boolean | undefined; onPress: () => void }> = ({ submitting, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={submitting}
    style={[styles.submitButton, submitting ? styles.disabledButton : null]}
    accessibilityLabel="Submit feedback"
    accessibilityRole="button"
  >
    {submitting ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.submitButtonText}>Submit Feedback</Text>
    )}
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#fb6e14",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    color: "#ef4444",
    marginVertical: 8,
  },
  bookingContainer: {
    marginBottom: 16,
  },
  bookingHeader: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  bookingSubTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  expandedSection: {
    marginTop: 8,
  },
  qrCodeSection: {
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#c2410c",
    marginBottom: 12,
  },
  qrCodeExpiry: {
    fontWeight: "600",
    color: "#c2410c",
    marginTop: 8,
  },
  qrCodeExpired: {
    fontWeight: "700",
    color: "#e11d48",
    marginTop: 8,
    textAlign: "center",
  },
  qrCodeNotAvailable: {
    fontWeight: "700",
    color: "#e11d48",
    textAlign: "center",
  },
  pendingApproval: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },
  pendingApprovalText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2563eb",
  },
  pendingApprovalDescription: {
    fontSize: 14,
    color: "#3b82f6",
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  cancelButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  feedbackForm: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  feedbackFormTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  feedbackSubmitted: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
  },
  feedbackSubmittedText: {
    fontWeight: "600",
    color: "#22c55e",
    marginLeft: 8,
  },
  ratingSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#e11d48",
  },
  ratingStars: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    padding: 8,
  },
  ratingDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  textInputSection: {
    marginBottom: 24,
  },
  textInput: {
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
  },
  purchaseInterest: {
    marginBottom: 32,
  },
  purchaseButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  purchaseButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  activePurchaseButton: {
    backgroundColor: "#fb6e14",
    borderColor: "#fb6e14",
  },
  activePurchaseButtonText: {
    color: "#FFF",
  },
  purchaseButtonText: {
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#fb6e14",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

// Utility function
const getStatusColor = (status: string) => {
  const colors = {
    APPROVED: { backgroundColor: "#d1fae5", borderColor: "#10b981" },
    PENDING: { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
    REJECTED: { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
    COMPLETED: { backgroundColor: "#e0f2fe", borderColor: "#3b82f6" },
  };
  return colors[status as keyof typeof colors] || { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" };
};

export default Booking;