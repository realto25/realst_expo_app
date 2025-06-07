import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { ScrollView, StyleSheet, Text, View, Animated, RefreshControl } from "react-native";
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
  userId: string;
}

export function LeaveRequestHistory() {
  const { getToken, userId } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
      fadeAnims.current = userRequests.map(() => new Animated.Value(0));

      userRequests.forEach((_, index: number) => {
        Animated.timing(fadeAnims.current[index], {
          toValue: 1,
          duration: 600,
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
        return "#22c55e";
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
        <LinearGradient colors={['#ffedd5', '#fed7aa']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#f97316" />
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
      <LinearGradient colors={['#ffedd5', '#fed7aa']} style={styles.header}>
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
          <Animated.View key={request.id} style={[styles.card, { opacity: fadeAnims.current[index] }]}>
            <Card style={styles.cardContainer}>
              <Card.Content>
                <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.cardHeader}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#1e293b',
    fontSize: 16,
    fontFamily: "Manrope-Regular",
    marginTop: 12,
  },
  card: {
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRange: {
    fontSize: 16,
    fontFamily: "Manrope-SemiBold",
    color: "#1e293b",
    fontWeight: '600',
  },
  statusChip: {
    height: 32,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Manrope-Bold",
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Manrope-SemiBold",
    color: "#4b5563",
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    fontFamily: "Manrope-Regular",
    color: "#1e293b",
    marginBottom: 12,
  },
  rejectionContainer: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Manrope-SemiBold",
    color: "#ef4444",
    marginBottom: 6,
  },
  rejectionText: {
    fontSize: 14,
    fontFamily: "Manrope-Regular",
    color: "#ef4444",
  },
  submittedDate: {
    fontSize: 12,
    fontFamily: "Manrope-Regular",
    color: "#6b7280",
    marginTop: 8,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: "Manrope-Regular",
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
    fontFamily: "Manrope-Regular",
    marginTop: 32,
  },
});
