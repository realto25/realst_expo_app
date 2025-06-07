import { useAuth } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
} from "react-native";
import { Button, Card, HelperText, TextInput, Title } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

axios.defaults.baseURL = "https://main-admin-dashboard-orpin.vercel.app";

const { width } = Dimensions.get("window");

export function LeaveRequestForm() {
  const { getToken, userId } = useAuth();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reason, setReason] = useState("");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!startDate || !endDate || !reason.trim()) {
      setError("All fields are required.");
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return;
    }

    try {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication failed.");
      }

      const response = await axios.post(
        "/api/leave-request",
        {
          clerkId: userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status !== 201) {
        throw new Error("Failed to submit leave request.");
      }

      setSuccess("Leave request submitted successfully!");
      setStartDate(new Date());
      setEndDate(new Date());
      setReason("");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => setSuccess(null), 2000);
      });
    } catch (error: any) {
      console.error("Error submitting leave request:", error.message || error);
      setError(error.message || "Failed to submit leave request.");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#ffedd5", "#fed7aa"]} style={styles.header}>
        <Title style={styles.title}>Submit Leave Request</Title>
      </LinearGradient>
      <Card style={styles.card}>
        <Card.Content>
          {error && (
            <Animated.View style={[styles.alert, { opacity: fadeAnim }]}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#fff"
                style={styles.alertIcon}
              />
              <Text style={styles.alertText}>{error}</Text>
            </Animated.View>
          )}
          {success && (
            <Animated.View
              style={[styles.alert, { opacity: fadeAnim, backgroundColor: "#22c55e" }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={styles.alertIcon}
              />
              <Text style={styles.alertText}>{success}</Text>
            </Animated.View>
          )}

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#f97316" style={styles.dateIcon} />
            <Text style={styles.dateText}>{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                selectedDate && setStartDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            style={styles.dateButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#f97316" style={styles.dateIcon} />
            <Text style={styles.dateText}>{endDate.toDateString()}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                selectedDate && setEndDate(selectedDate);
              }}
            />
          )}

          <TextInput
            label="Reason for Leave"
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              setError(null);
            }}
            multiline
            numberOfLines={4}
            style={styles.reasonInput}
            mode="outlined"
            placeholder="Enter your reason for leave"
            placeholderTextColor="#9ca3af"
            theme={{ colors: { primary: "#f97316", background: "#fff" } }}
          />
          <HelperText type="error" visible={!!error && !reason.trim()}>
            Reason is required.
          </HelperText>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
          >
            <LinearGradient colors={["#f97316", "#ea580c"]} style={styles.buttonGradient}>
              <Ionicons name="send-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Submit Request</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Manrope-Bold",
    color: "#1e293b",
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Manrope-SemiBold",
    color: "#1e293b",
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Manrope-Regular",
    color: "#1e293b",
  },
  reasonInput: {
    marginBottom: 12,
    backgroundColor: "#fff",
    fontFamily: "Manrope-Regular",
  },
  submitButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Manrope-Bold",
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Manrope-Regular",
    flex: 1,
  },
});
