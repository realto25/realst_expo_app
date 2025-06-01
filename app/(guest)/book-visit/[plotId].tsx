import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "@clerk/clerk-expo"; // Add this import
import { submitVisitRequest, VisitRequestType } from "../../../lib/api";

export default function BookVisitScreen() {
  const { plotId } = useLocalSearchParams();
  const router = useRouter();
  const { userId: clerkUserId } = useAuth(); // Get the current user's Clerk ID

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!form.email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    
    // Phone validation (basic)
    if (form.phone.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number");
      return false;
    }
    
    if (!plotId) {
      Alert.alert("Error", "Plot ID is missing");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Format the visit request data
      const visitData: VisitRequestType = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        date: date.toISOString().split('T')[0], // Format: YYYY-MM-DD
        time: formatTime(time),
        plotId: Array.isArray(plotId) ? plotId[0] : plotId,
        clerkId: clerkUserId || undefined, // Include Clerk user ID if logged in
      };

      console.log("Submitting visit request with data:", visitData);

      const response = await submitVisitRequest(visitData);
      
      console.log("Visit request submitted successfully:", response);

      Alert.alert(
        "Success!",
        "Your visit request has been submitted successfully. We'll contact you soon to confirm your appointment.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setForm({ name: "", email: "", phone: "" });
              setDate(new Date());
              setTime(new Date());
              // Navigate back or to a success screen
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Booking failed:", error);
      
      let errorMessage = "Failed to submit visit request. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert("Booking Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View
            style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}
          >
            <Text
              style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}
            >
              Schedule Visit
            </Text>
            <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 8 }}>
              Book your property viewing appointment
            </Text>
          </View>

          {/* Form Container */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            {/* Personal Information Section */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Contact Information
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Full Name *
                </Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={form.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: "#111827",
                  }}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Email Address *
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: "#111827",
                  }}
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Phone Number *
                </Text>
                <TextInput
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  maxLength={15}
                  value={form.phone}
                  onChangeText={(text) => handleInputChange("phone", text)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: "#111827",
                  }}
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Date & Time Section */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Preferred Date & Time
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Date *
                </Text>
                <TouchableOpacity
                  onPress={() => !loading && setDatePickerVisibility(true)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 16, color: "#111827" }}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Time *
                </Text>
                <TouchableOpacity
                  onPress={() => !loading && setTimePickerVisibility(true)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 16, color: "#111827" }}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#D1D5DB" : "#F97316",
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                shadowColor: "#000",
                shadowOpacity: loading ? 0 : 0.05,
                shadowRadius: 4,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {loading ? "Submitting Request..." : "Schedule Visit"}
              </Text>
            </TouchableOpacity>

            {/* Date Picker Modal */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={date}
              minimumDate={new Date()}
              onConfirm={(selectedDate) => {
                setDatePickerVisibility(false);
                setDate(selectedDate);
              }}
              onCancel={() => setDatePickerVisibility(false)}
            />

            {/* Time Picker Modal */}
            <DateTimePickerModal
              isVisible={isTimePickerVisible}
              mode="time"
              date={time}
              onConfirm={(selectedTime) => {
                setTimePickerVisibility(false);
                setTime(selectedTime);
              }}
              onCancel={() => setTimePickerVisibility(false)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}