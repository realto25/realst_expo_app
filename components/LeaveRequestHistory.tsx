// LeaveRequestHistory.tsx
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, RefreshControl } from "react-native";
import { Card, Title, Chip, ActivityIndicator } from "react-native-paper";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
}

export function LeaveRequestHistory() {
  const { getToken, userId } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaveRequests = async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication failed.");
      }

      const response = await axios.get("/api/leave-request", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status !== 200) {
        throw new Error("Failed to fetch leave requests.");
      }

      // Filter requests for the current user
      const userRequests = response.data.filter(
        (request: LeaveRequest) => request.userId === userId
      );
      setRequests(userRequests);
    } catch (error: any) {
      console.error("Error fetching leave requests:", error.message || error);
      setError(error.message || "Failed to fetch leave requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "#4CAF50";
      case "REJECTED":
        return "#f44336";
      default:
        return "#FFA000";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Title style={styles.title}>Leave Request History</Title>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {requests.length === 0 ? (
        <Text style={styles.emptyText}>No leave requests found.</Text>
      ) : (
        requests.map((request) => (
          <Card key={request.id} style={styles.card}>
            <Card.Content>
              <View style={styles.headerRow}>
                <Title style={styles.dateRange}>
                  {formatDate(request.startDate)} - {formatDate(request.endDate)}
                </Title>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(request.status) }
                  ]}
                  textStyle={styles.statusText}
                >
                  {request.status}
                </Chip>
              </View>

              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{request.reason}</Text>

              {request.status === "REJECTED" && request.rejectionReason && (
                <View style={styles.rejectionContainer}>
                  <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                  <Text style={styles.rejectionText}>
                    {request.rejectionReason}
                  </Text>
                </View>
              )}

              <Text style={styles.submittedDate}>
                Submitted on: {formatDate(request.createdAt)}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateRange: {
    fontSize: 16,
    color: "#333",
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  rejectionContainer: {
    backgroundColor: "#ffebee",
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: "#d32f2f",
  },
  submittedDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  errorText: {
    color: "#f44336",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 32,
  },
});