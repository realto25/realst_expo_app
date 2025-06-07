import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react"; // Import useRef
import { ScrollView, StyleSheet, Text, View, Animated, RefreshControl} from "react-native";
import { Card, Title, Chip, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  userId: string; // Ensure userId is part of the interface as you're filtering by it
}

export function LeaveRequestHistory() {
  const { getToken, userId } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Use useRef to store Animated.Value instances so they persist across renders
  const fadeAnims = useRef<Animated.Value[]>([]);

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

      const userRequests: LeaveRequest[] = response.data.filter(
        (request: LeaveRequest) => request.userId === userId
      );

      setRequests(userRequests);

      // Initialize or reset fadeAnims for new requests
      fadeAnims.current = userRequests.map(() => new Animated.Value(0));

      // Animate cards
      userRequests.forEach((_, index: number) => {
        Animated.timing(fadeAnims.current[index], { // Access via .current
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
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
        return "#10b981";
      case "REJECTED":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "checkmark-circle-outline";
      case "REJECTED":
        return "close-circle-outline";
      default:
        return "hourglass-outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#f97316', '#ea580c']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Leave History...</Text>
        </LinearGradient>
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
      <LinearGradient colors={['#f97316', '#ea580c']} style={styles.header}>
        <Title style={styles.title}>Leave Request History</Title>
      </LinearGradient>

      {error && (
        <View style={styles.alert}>
          <Ionicons name="alert-circle-outline" size={20} color="#fff" style={styles.alertIcon} />
          <Text style={styles.alertText}>{error}</Text>
        </View>
      )}

      {requests.length === 0 ? (
        <Text style={styles.emptyText}>No leave requests found.</Text>
      ) : (
        requests.map((request, index) => (
          // Access Animated.Value instances from fadeAnims.current
          <Animated.View key={request.id} style={[styles.card, { opacity: fadeAnims.current[index] }]}>
            <Card style={styles.cardContainer}>
              <Card.Content>
                <LinearGradient colors={['#f97316', '#ea580c']} style={styles.cardHeader}>
                  <View style={styles.headerRow}>
                    <Text style={styles.dateRange}>
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </Text>
                    <Chip
                      mode="flat"
                      style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}
                      textStyle={styles.statusText}
                      icon={() => <Ionicons name={getStatusIcon(request.status)} size={16} color="#fff" />}
                    >
                      {request.status}
                    </Chip>
                  </View>
                </LinearGradient>

                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{request.reason}</Text>

                {request.status === "REJECTED" && request.rejectionReason && (
                  <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
                  </View>
                )}

                <Text style={styles.submittedDate}>
                  Submitted on: {formatDate(request.createdAt)}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
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
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  cardContainer: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRange: {
    fontSize: 16,
    color: "#fff",
    fontWeight: '600',
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
    backgroundColor: "rgba(239, 68, 68, 0.1)",
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
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 32,
  },
});