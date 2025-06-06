import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, TextInput, Title, HelperText } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

// Configure axios base URL
axios.defaults.baseURL = "http://172.31.99.212:3000";

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

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!startDate || !endDate || !reason.trim()) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      setLoading(false);
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
    } catch (error: any) {
      console.error("Error submitting leave request:", error.message || error);
      setError(error.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Submit Leave Request</Title>
      <Card style={styles.card}>
        <Card.Content>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>{success}</Text>}

          <Text style={styles.label}>Start Date</Text>
          <Button
            mode="outlined"
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            {startDate.toDateString()}
          </Button>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>End Date</Text>
          <Button
            mode="outlined"
            onPress={() => setShowEndDatePicker(true)}
            style={styles.dateButton}
          >
            {endDate.toDateString()}
          </Button>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          <TextInput
            label="Reason for Leave"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            style={styles.reasonInput}
            mode="outlined"
            placeholder="Enter your reason for leave"
            error={!!error && !reason.trim()}
          />
          <HelperText type="error" visible={!!error && !reason.trim()}>
            Reason is required.
          </HelperText>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            Submit Leave Request
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
    textAlign: "center",
    color: "#333",
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    marginBottom: 16,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  reasonInput: {
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
  },
  errorText: {
    color: "#f44336",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  successText: {
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
});