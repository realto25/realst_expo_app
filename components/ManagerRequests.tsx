import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Card, Paragraph, TextInput, Title } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";

// Configure axios base URL
axios.defaults.baseURL = "http://172.31.99.212:3000";

interface VisitRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED";
  purpose?: string;
  plot: {
    id: string;
    title: string;
    location: string;
    project: {
      id: string;
      name: string;
    };
  };
  assignedManager?: {
    id: string;
    name: string;
    email: string;
    clerkId: string;
  };
  userId?: string; // Added to store the visitor's userId for notifications
  rejectionReason?: string | null;
  qrCode?: string | null;
  updatedAt: string; // Added for history sorting
}

// Add this helper function at the top of the file, after imports
const generateQRData = (request: VisitRequest) => {
  // Only include essential data for the QR code
  const qrData = {
    id: request.id,
    name: request.name,
    date: request.date,
    time: request.time,
    plotId: request.plot.id,
    status: request.status,
  };
  return JSON.stringify(qrData);
};

export function ManagerVisitRequests() {
  const { getToken, userId } = useAuth();
  const [requests, setRequests] = useState<VisitRequest[]>([]); // Current ASSIGNED requests
  const [history, setHistory] = useState<VisitRequest[]>([]); // APPROVED/REJECTED requests
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestIdForRejection, setSelectedRequestIdForRejection] =
    useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchData();
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get("/api/visit-requests", {
        headers: { Authorization: `Bearer ${token}` },
        params: { clerkId: userId, role: "MANAGER" },
      });

      console.log(
        "Visit Requests Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format: Expected an array");
      }

      // Filter ASSIGNED requests for current actionable list
      const assignedRequests = response.data.filter((req: VisitRequest) => {
        const matches =
          req.status === "ASSIGNED" && req.assignedManager?.clerkId === userId;
        console.log(
          `Request ID: ${req.id}, Status: ${req.status}, Assigned Manager ClerkId: ${req.assignedManager?.clerkId}, UserId: ${userId}, Matches: ${matches}`
        );
        return matches;
      });

      // Filter APPROVED and REJECTED requests for history
      const historyRequests = response.data
        .filter(
          (req: VisitRequest) =>
            req.status === "APPROVED" || req.status === "REJECTED"
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ); // Sort by updatedAt descending

      setRequests(assignedRequests);
      setHistory(historyRequests);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error.message || error);
      setError("Failed to load visit requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: VisitRequest) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `/api/visit-requests/${request.id}/accept`,
        {
          clerkId: userId,
          plotId: request.plot.id,
          visitorName: request.name,
          visitDate: request.date,
          visitTime: request.time,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.qrCode) {
        // Generate a smaller QR code data
        const qrData = generateQRData(request);
        await fetchData();
      } else {
        setError("Failed to generate QR code.");
      }

      // Create notification for the visitor (not the manager)
      if (request.userId) {
        await axios.post(
          "/api/notifications",
          {
            type: "VISIT_REQUEST_APPROVED",
            title: "Visit Request Approved",
            message: `Your visit request for ${request.plot.title} has been approved by the manager.`,
            userId: request.userId, // Notify the visitor
            read: false,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error: any) {
      console.error("Error accepting request:", error);
      setError("Failed to accept request. Please try again.");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const request = requests.find((req) => req.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      const response = await axios.post(
        `/api/visit-requests/${requestId}/reject`,
        { clerkId: userId, reason: rejectionReason || "No reason provided" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to reject request: Status ${response.status}`);
      }

      setSelectedRequestIdForRejection(null);
      setRejectionReason("");
      await fetchData(); // Refresh data to move request to history

      // Create notification for the visitor
      if (request.userId) {
        await axios.post(
          "/api/notifications",
          {
            type: "VISIT_REQUEST_REJECTED",
            title: "Visit Request Rejected",
            message: `Your visit request for ${
              request.plot.title
            } has been rejected by the manager. Reason: ${
              rejectionReason || "No reason provided"
            }`,
            userId: request.userId, // Notify the visitor
            read: false,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error: any) {
      console.error("Error rejecting request:", error.message || error);
      setError(`Failed to reject request: ${error.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Title style={styles.title}>Visit Requests</Title>
      {requests.length === 0 ? (
        <Text style={styles.noDataText}>No assigned visit requests.</Text>
      ) : (
        requests.map((request) => (
          <Card key={request.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Paragraph style={styles.details}>{request.name}</Paragraph>
                </View>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Plot:</Text>
                  <Paragraph style={styles.details}>
                    {request.plot?.title || "N/A"} (
                    {request.plot?.project?.name || "Unknown Project"})
                  </Paragraph>
                </View>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Paragraph style={styles.details}>
                    {format(new Date(request.date), "P")} {request.time}
                  </Paragraph>
                </View>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Paragraph style={styles.status}>
                    <Text style={styles.statusIcon}>⏳</Text> {request.status}
                  </Paragraph>
                </View>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Assigned Manager:</Text>
                  <Paragraph style={styles.details}>
                    {request.assignedManager?.email || "N/A"}
                  </Paragraph>
                </View>
              </View>

              {request.status === "ASSIGNED" && (
                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={() => handleAccept(request)}
                    style={styles.acceptButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Accept
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedRequestIdForRejection(request.id)}
                    style={styles.rejectButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Reject
                  </Button>
                </View>
              )}

              {request.status === "APPROVED" && request.qrCode && (
                <View style={styles.qrContainer}>
                  <Paragraph style={styles.qrText}>
                    Approved. Scan QR Code:
                  </Paragraph>
                  <QRCode
                    value={generateQRData(request)}
                    size={150}
                    color="#000"
                    backgroundColor="#fff"
                    ecl="M"
                  />
                </View>
              )}

              {request.status === "REJECTED" && (
                <Paragraph style={styles.rejectedText}>
                  Rejected.{" "}
                  {request.rejectionReason &&
                    `Reason: ${request.rejectionReason}`}
                </Paragraph>
              )}

              {selectedRequestIdForRejection === request.id && (
                <View style={styles.rejectionForm}>
                  <TextInput
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    style={styles.reasonInput}
                    mode="outlined"
                    placeholder="Enter reason for rejection"
                  />
                  <Button
                    mode="contained"
                    onPress={() => handleReject(request.id)}
                    style={styles.submitRejection}
                    labelStyle={styles.buttonLabel}
                    disabled={!rejectionReason.trim()}
                  >
                    Submit Rejection
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => setSelectedRequestIdForRejection(null)}
                    style={styles.cancelButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Cancel
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        ))
      )}

      {/* History Section */}
      <Title style={styles.title}>History</Title>
      {history.length === 0 ? (
        <Text style={styles.noDataText}>No history available.</Text>
      ) : (
        history.map((request) => (
          <Card key={request.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Paragraph style={styles.details}>{request.name}</Paragraph>
                </View>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Plot:</Text>
                  <Paragraph style={styles.details}>
                    {request.plot?.title || "N/A"} (
                    {request.plot?.project?.name || "Unknown Project"})
                  </Paragraph>
                </View>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Date & Time:</Text>
                  <Paragraph style={styles.details}>
                    {format(new Date(request.date), "P")} {request.time}
                  </Paragraph>
                </View>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Action Taken:</Text>
                  <Paragraph
                    style={
                      request.status === "APPROVED"
                        ? styles.approvedText
                        : styles.rejectedText
                    }
                  >
                    {request.status}
                  </Paragraph>
                </View>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.detailLabel}>Action Date:</Text>
                  <Paragraph style={styles.details}>
                    {format(new Date(request.updatedAt), "PPpp")}
                  </Paragraph>
                </View>
              </View>
              {request.status === "APPROVED" && request.qrCode && (
                <View style={styles.qrContainer}>
                  <Paragraph style={styles.qrText}>QR Code:</Paragraph>
                  <QRCode
                    value={generateQRData(request)}
                    size={150}
                    color="#000"
                    backgroundColor="#fff"
                    ecl="M"
                  />
                </View>
              )}
              {request.status === "REJECTED" && request.rejectionReason && (
                <View>
                  <Text style={styles.detailLabel}>Rejection Reason:</Text>
                  <Paragraph style={styles.rejectedText}>
                    {request.rejectionReason}
                  </Paragraph>
                </View>
              )}
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
  centered: {
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
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardColumn: {
    flex: 1,
    paddingRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  details: {
    fontSize: 14,
    color: "#555",
  },
  status: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "bold",
  },
  statusIcon: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: "#f44336",
    borderRadius: 6,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  qrContainer: {
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
  qrText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 12,
  },
  approvedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  rejectedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#f44336",
  },
  rejectionForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  reasonInput: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  submitRejection: {
    backgroundColor: "#f44336",
    marginBottom: 8,
    borderRadius: 6,
  },
  cancelButton: {
    marginTop: 4,
  },
  errorText: {
    color: "#f44336",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#333",
  },
});
