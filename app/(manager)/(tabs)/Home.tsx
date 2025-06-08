import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Surface,
  Text,
} from "react-native-paper";
import {
  getAllPlots,
  getProjects,
  getUserFeedback,
  getVisitRequests
} from "../../../lib/api"; // Ensure this path is correct

const screenWidth = Dimensions.get("window").width;
const { height: screenHeight } = Dimensions.get("window");

// iOS-style safe area constants
const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const CARD_SPACING = 16;
const BORDER_RADIUS = 16;
const SHADOW_CONFIG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

interface DashboardStats {
  projects: number;
  plots: number;
  availablePlots: number;
  visitRequests: number;
  pendingVisits: number;
  avgRating: number;
  recentSales: number;
}

interface UserMetadata {
  role?: "guest" | "client" | "manager";
}

export default function ManagerHomeTabScreen() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    plots: 0,
    availablePlots: 0,
    visitRequests: 0,
    pendingVisits: 0,
    avgRating: 0,
    recentSales: 0,
  });
  // No need for projects, plots, visits state if not displaying detailed lists/charts
  // const [projects, setProjects] = useState<ProjectType[]>([]);
  // const [plots, setPlots] = useState<PlotType[]>([]);
  // const [visits, setVisits] = useState<VisitRequest[]>([]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const currentUserId = user?.id;

      if (!currentUserId) {
        console.warn("Clerk user ID not available. Dashboard data might be limited.");
      }

      // We still fetch data to calculate stats, even if not directly displayed
      const results = await Promise.allSettled([
        getProjects(),
        getAllPlots(),
        getVisitRequests(),
        currentUserId ? getUserFeedback(currentUserId) : Promise.resolve([]),
      ]);

      const projectsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const plotsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const visitsData = results[2].status === 'fulfilled' ? results[2].value : [];
      const feedbackData = results[3].status === 'fulfilled' ? results[3].value : [];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['Projects', 'Plots', 'Visits', 'Feedback'];
          console.warn(`Failed to load ${apiNames[index]}:`, result.reason);
        }
      });

      const safeProjectsData = Array.isArray(projectsData) ? projectsData : [];
      const safePlotsData = Array.isArray(plotsData) ? plotsData : [];
      const safeVisitsData = Array.isArray(visitsData) ? visitsData : [];
      const safeFeedbackData = Array.isArray(feedbackData) ? feedbackData : [];

      const availablePlots = safePlotsData.filter(p => p?.status === "AVAILABLE").length;
      const pendingVisits = safeVisitsData.filter(v => v?.status === "PENDING").length;

      const avgRating = safeFeedbackData.length > 0 ?
        safeFeedbackData.reduce((sum: number, f: any) => {
          const rating = typeof f?.rating === 'number' ? f.rating : 0;
          return sum + rating;
        }, 0) / safeFeedbackData.length : 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentSales = safePlotsData.filter(p => {
        if (p?.status !== "SOLD" || !p?.createdAt) return false;
        try {
          return new Date(p.createdAt) >= sevenDaysAgo;
        } catch (e) {
          console.warn("Invalid createdAt date for plot:", p.createdAt, e);
          return false;
        }
      }).length;

      setStats({
        projects: safeProjectsData.length,
        plots: safePlotsData.length,
        availablePlots,
        visitRequests: safeVisitsData.length,
        pendingVisits,
        avgRating: parseFloat(avgRating.toFixed(1)),
        recentSales,
      });

      // Removed setting projects, plots, visits state as they are not used for display
      // setProjects(safeProjectsData);
      // setPlots(safePlotsData);
      // setVisits(safeVisitsData);

    } catch (error) {
      console.error("Critical error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please check your network and try again.");

      setStats({
        projects: 0,
        plots: 0,
        availablePlots: 0,
        visitRequests: 0,
        pendingVisits: 0,
        avgRating: 0,
        recentSales: 0,
      });
      // Removed setting projects, plots, visits state on error
      // setProjects([]);
      // setPlots([]);
      // setVisits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user) {
      loadData();
    } else if (isLoaded && !user) {
      setError("User not authenticated. Please log in.");
      setLoading(false);
    }
  }, [loadData, isLoaded, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const showErrorAlert = useCallback(() => {
    if (error) {
      Alert.alert(
        "Data Loading Error",
        error,
        [
          { text: "Retry", onPress: loadData },
          { text: "OK", style: "cancel" }
        ],
        { cancelable: false }
      );
    }
  }, [error, loadData]);

  useEffect(() => {
    showErrorAlert();
  }, [showErrorAlert]);

  const getManagerInitials = () => {
    if (!user?.firstName && !user?.lastName) return "M";
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (!isLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {!isLoaded ? "Initializing..." : "Loading Dashboard..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Avatar.Text
              size={40}
              label={getManagerInitials()}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <Surface style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF453A" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Surface>
        )}

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, styles.primaryStatCard]}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="office-building" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{stats.plots}</Text>
            <Text style={styles.statLabel}>Total Plots</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{stats.visitRequests}</Text>
            <Text style={styles.statLabel}>Visits</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#32D74B" />
            </View>
            <Text style={styles.statValue}>{stats.recentSales}</Text>
            <Text style={styles.statLabel}>Recent Sales</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD60A" />
            </View>
            <Text style={styles.statValue}>{stats.avgRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="clock-alert" size={24} color="#FF453A" />
            </View>
            <Text style={styles.statValue}>{stats.pendingVisits}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Surface>
        </View>

        {/* Empty State - Adjusted slightly for minimalist view */}
        {stats.projects === 0 && stats.plots === 0 && stats.visitRequests === 0 && !loading && !error && (
          <Surface style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="chart-line" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Pull down to refresh or check backend connection.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          </Surface>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SAFE_AREA_TOP + 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 2,
  },
  profileButton: {
    marginLeft: 16,
  },
  avatar: {
    backgroundColor: "#007AFF",
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
    borderLeftWidth: 4,
    borderLeftColor: "#FF453A",
    ...SHADOW_CONFIG,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#FF453A",
  },
  retryText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: (screenWidth - (CARD_SPACING * 3)) / 2,
    marginBottom: CARD_SPACING,
    padding: 20,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    ...SHADOW_CONFIG,
  },
  primaryStatCard: {
    backgroundColor: "#F0F8FF",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    textAlign: "center",
  },
  // Removed chart and table related styles
  emptyStateCard: {
    marginHorizontal: CARD_SPACING,
    marginBottom: CARD_SPACING,
    padding: 30,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_CONFIG,
    minHeight: screenHeight * 0.4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomPadding: {
    height: 40,
  },
});
