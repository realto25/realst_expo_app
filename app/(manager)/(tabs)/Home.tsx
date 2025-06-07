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
  DataTable,
  Surface,
  Text,
} from "react-native-paper";
import { VictoryArea, VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryLine, VictoryPie, VictoryTheme } from "victory-native/dist";
import {
  getAllPlots,
  getProjects,
  getUserFeedback,
  getVisitRequests,
  PlotType,
  ProjectType,
  VisitRequest,
} from "../../../lib/api";

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

export default function ManagerHomeTabScreen() {
  const { user, isLoaded } = useUser(); // Get both user and isLoaded state
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
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [plots, setPlots] = useState<PlotType[]>([]);
  const [visits, setVisits] = useState<VisitRequest[]>([]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Use user.id directly from the useUser hook
      const currentUserId = user?.id;

      if (!currentUserId) {
        console.warn("Clerk user ID not available. Dashboard data might be limited.");
      }

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        getProjects(),
        getAllPlots(),
        getVisitRequests(),
        currentUserId ? getUserFeedback(currentUserId) : Promise.resolve([]), // Only fetch if user ID exists
      ]);

      // Extract successful results or use empty arrays as fallbacks
      const projectsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const plotsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const visitsData = results[2].status === 'fulfilled' ? results[2].value : [];
      const feedbackData = results[3].status === 'fulfilled' ? results[3].value : [];

      // Log any failed requests
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['Projects', 'Plots', 'Visits', 'Feedback'];
          console.warn(`Failed to load ${apiNames[index]}:`, result.reason);
        }
      });

      // Calculate statistics with safe null/undefined checks
      const safeProjectsData = Array.isArray(projectsData) ? projectsData : [];
      const safePlotsData = Array.isArray(plotsData) ? plotsData : [];
      const safeVisitsData = Array.isArray(visitsData) ? visitsData : [];
      const safeFeedbackData = Array.isArray(feedbackData) ? feedbackData : [];

      const availablePlots = safePlotsData.filter(p => p?.status === "AVAILABLE").length;
      const pendingVisits = safeVisitsData.filter(v => v?.status === "PENDING").length;

      // Calculate average rating with proper error handling and type safety
      const avgRating = safeFeedbackData.length > 0 ?
        safeFeedbackData.reduce((sum: number, f) => {
          const rating = typeof f?.rating === 'number' ? f.rating : 0;
          return sum + rating;
        }, 0) / safeFeedbackData.length : 0;

      // Calculate recent sales (last 7 days)
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

      setProjects(safeProjectsData);
      setPlots(safePlotsData);
      setVisits(safeVisitsData);

    } catch (error) {
      console.error("Critical error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please check your network and try again.");

      // Reset to empty states on complete failure
      setStats({
        projects: 0,
        plots: 0,
        availablePlots: 0,
        visitRequests: 0,
        pendingVisits: 0,
        avgRating: 0,
        recentSales: 0,
      });
      setProjects([]);
      setPlots([]);
      setVisits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]); // Depend on user.id instead of the entire user object

  useEffect(() => {
    // Only load data when Clerk has finished loading and we have a user
    if (isLoaded && user) {
      loadData();
    } else if (isLoaded && !user) {
      // Handle case where Clerk is loaded but no user is authenticated
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

  // Show error alert when error state changes
  useEffect(() => {
    showErrorAlert();
  }, [showErrorAlert]);

  // Show loading state while Clerk is initializing
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

  // Safe chart data preparation with better error handling
  const createPriceDistribution = () => {
    if (!projects.length || !plots.length) {
      return [{ x: 'No Data', y: 0 }];
    }

    const data = projects.map((project, index) => {
      const projectPlots = plots.filter(p => p?.projectId === project?.id);
      const avgPrice = projectPlots.length ?
        projectPlots.reduce((sum, p) => sum + (typeof p?.price === 'number' ? p.price : 0), 0) / projectPlots.length : 0;

      return {
        x: project?.name?.substring(0, 10) || `Project ${index + 1}`,
        y: Math.round(avgPrice),
        label: avgPrice > 0 ? `$${Math.round(avgPrice).toLocaleString()}` : ''
      };
    });

    if (data.some(d => d.y > 0)) {
      return data.filter(d => d.y > 0);
    }
    return data;
  };

  const createVisitTrends = () => {
    const trends = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);

      const dayVisits = visits.filter(v => {
        try {
          return v?.date && new Date(v.date).toDateString() === date.toDateString();
        } catch (e) {
          console.warn("Invalid visit date for trend:", v?.date, e);
          return false;
        }
      }).length;

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

      return {
        x: dayOfWeek,
        y: dayVisits,
        label: `${dayVisits}`
      };
    });
    return trends;
  };

  const createStatusDistribution = () => {
    const statusCounts = {
      AVAILABLE: plots.filter(p => p?.status === "AVAILABLE").length,
      RESERVED: plots.filter(p => p?.status === "RESERVED").length,
      SOLD: plots.filter(p => p?.status === "SOLD").length
    };

    const data = [
      { x: "Available", y: statusCounts.AVAILABLE },
      { x: "Reserved", y: statusCounts.RESERVED },
      { x: "Sold", y: statusCounts.SOLD }
    ];

    return data.filter(item => item.y > 0);
  };

  const getTopProjects = () => {
    if (!projects.length || !plots.length) return [];

    return [...projects]
      .map(project => ({
        ...project,
        soldCount: plots.filter(p => p?.projectId === project?.id && p?.status === "SOLD").length
      }))
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 3);
  };

  const priceDistribution = createPriceDistribution();
  const visitTrends = createVisitTrends();
  const statusDistribution = createStatusDistribution();
  const topProjects = getTopProjects();

  // Victory chart color schemes
  const colorScale = ["#34C759", "#FF9500", "#FF3B30", "#007AFF", "#5856D6"];
  const pieColorScale = ["#34C759", "#FF9500", "#FF3B30"];

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "#34C759";
      case "PENDING": return "#FF9500";
      case "REJECTED": return "#FF453A";
      case "COMPLETED": return "#32D74B";
      default: return "#8E8E93";
    }
  };

  const formatVisitDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "Invalid Date";
    }
  };

  const getUserInitials = (userData: any) => { // Consider more specific type than 'any'
    if (!userData?.name) return "V";
    return userData.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  };

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

        {/* Charts Section */}
        {statusDistribution.length > 0 && statusDistribution.some(d => d.y > 0) && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Property Distribution</Text>
              <TouchableOpacity>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.chartContainer}>
              <VictoryPie
                data={statusDistribution}
                width={screenWidth - (CARD_SPACING * 2)}
                height={220}
                colorScale={pieColorScale}
                innerRadius={50}
                padAngle={3}
                labelRadius={({ innerRadius }) => innerRadius + 60}
                theme={VictoryTheme.material}
                labelComponent={<VictoryLabel style={{ fontSize: 14, fill: "#1C1C1E" }} />}
              />
            </View>
          </Surface>
        )}

        {visitTrends.some(v => v.y > 0) && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Visit Trends</Text>
              <Text style={styles.cardSubtitle}>Last 7 days</Text>
            </View>
            <View style={styles.chartContainer}>
              <VictoryChart
                width={screenWidth - (CARD_SPACING * 2)}
                height={220}
                theme={VictoryTheme.material}
                padding={{ left: 50, top: 20, right: 50, bottom: 50 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickFormat={(value) => `${value}`}
                  style={{
                    tickLabels: { fontSize: 12, fill: "#8E8E93" },
                    grid: { stroke: "#F2F2F7" }
                  }}
                />
                <VictoryAxis
                  tickFormat={(x) => x}
                  style={{
                    tickLabels: { fontSize: 12, fill: "#8E8E93" },
                    grid: { stroke: "transparent" }
                  }}
                />
                <VictoryArea
                  data={visitTrends}
                  style={{
                    data: { fill: "#007AFF", fillOpacity: 0.1, stroke: "#007AFF", strokeWidth: 3 }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
                <VictoryLine
                  data={visitTrends}
                  style={{
                    data: { stroke: "#007AFF", strokeWidth: 3 }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              </VictoryChart>
            </View>
          </Surface>
        )}

        {priceDistribution.length > 0 && priceDistribution.some(p => p.y > 0) && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Average Plot Prices</Text>
              <Text style={styles.cardSubtitle}>By project</Text>
            </View>
            <View style={styles.chartContainer}>
              <VictoryChart
                width={screenWidth - (CARD_SPACING * 2)}
                height={220}
                theme={VictoryTheme.material}
                domainPadding={{ x: 20 }}
                padding={{ left: 80, top: 20, right: 50, bottom: 80 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickFormat={(value) => `$${value.toLocaleString()}`}
                  style={{
                    tickLabels: { fontSize: 11, fill: "#8E8E93" },
                    grid: { stroke: "#F2F2F7" }
                  }}
                />
                <VictoryAxis
                  style={{
                    tickLabels: { fontSize: 11, fill: "#8E8E93", angle: -45, verticalAnchor: "middle", textAnchor: "end" },
                    grid: { stroke: "transparent" }
                  }}
                />
                <VictoryBar
                  data={priceDistribution}
                  style={{
                    data: { fill: "#007AFF" }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              </VictoryChart>
            </View>
          </Surface>
        )}

        {/* Top Projects */}
        {topProjects.length > 0 && (
          <Surface style={styles.sectionCard}>
            <View style={[styles.cardHeader, styles.sectionCardPadding]}>
              <Text style={styles.cardTitle}>Top Performing Projects</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>

            <DataTable style={styles.dataTable}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title textStyle={styles.tableHeaderText}>Project</DataTable.Title>
                <DataTable.Title numeric textStyle={styles.tableHeaderText}>Plots</DataTable.Title>
                <DataTable.Title numeric textStyle={styles.tableHeaderText}>Sold</DataTable.Title>
              </DataTable.Header>

              {topProjects.map((project) => {
                const projectPlots = plots.filter(p => p?.projectId === project?.id);
                const soldPlots = projectPlots.filter(p => p?.status === "SOLD").length;

                return (
                  <DataTable.Row key={project?.id || `project-${Math.random()}`} style={styles.tableRow}>
                    <DataTable.Cell textStyle={styles.tableCellText}>
                      {project?.name || 'Unknown Project'}
                    </DataTable.Cell>
                    <DataTable.Cell numeric textStyle={styles.tableCellText}>
                      {projectPlots.length}
                    </DataTable.Cell>
                    <DataTable.Cell numeric textStyle={styles.tableCellText}>
                      {soldPlots}
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </Surface>
        )}

        {/* Recent Visit Requests */}
        {visits.length > 0 && (
          <Surface style={styles.sectionCard}>
            <View style={[styles.cardHeader, styles.sectionCardPadding]}>
              <Text style={styles.cardTitle}>Recent Visit Requests</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>

            {visits.slice(0, 3).map((visit) => (
              <TouchableOpacity key={visit?.id || `visit-${Math.random()}`} style={styles.visitItem}>
                <Avatar.Text
                  size={44}
                  label={getUserInitials(visit?.user)}
                  style={styles.visitAvatar}
                  labelStyle={styles.visitAvatarLabel}
                />
                <View style={styles.visitDetails}>
                  <Text style={styles.visitName}>
                    {visit?.user?.name || visit?.name || 'Unknown Visitor'}
                  </Text>
                  <Text style={styles.visitPlot}>
                    {visit?.plot?.title || 'Unknown Plot'}
                  </Text>
                  <Text style={styles.visitDate}>
                    {formatVisitDate(visit?.date)} at {visit?.time || 'Unknown time'}
                  </Text>
                </View>
                <View style={[
                  styles.visitStatus,
                  { backgroundColor: getVisitStatusColor(visit?.status || 'UNKNOWN') }
                ]}>
                  <Text style={styles.visitStatusText}>
                    {visit?.status || 'UNKNOWN'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Surface>
        )}

        {/* Empty State */}
        {projects.length === 0 && plots.length === 0 && visits.length === 0 && !loading && !error && (
          <Surface style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="chart-line" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Pull down to refresh and load your dashboard data, or check backend connection.
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
  chartCard: {
    marginHorizontal: CARD_SPACING,
    marginBottom: CARD_SPACING,
    padding: 20,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    ...SHADOW_CONFIG,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    marginHorizontal: CARD_SPACING,
    marginBottom: CARD_SPACING,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    ...SHADOW_CONFIG,
    overflow: "hidden", // Important for DataTable and other overflowing content
  },
  sectionCardPadding: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  seeAllButton: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  dataTable: {
    paddingHorizontal: 0, // DataTable itself has padding, adjust if needed
  },
  tableHeader: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 20,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  tableRow: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  tableCellText: {
    fontSize: 14,
    color: "#1C1C1E",
  },
  visitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  visitAvatar: {
    backgroundColor: "#5856D6",
    marginRight: 12,
  },
  visitAvatarLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  visitDetails: {
    flex: 1,
  },
  visitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  visitPlot: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 2,
  },
  visitDate: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  visitStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyStateCard: {
    marginHorizontal: CARD_SPACING,
    marginBottom: CARD_SPACING,
    padding: 30,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_CONFIG,
    minHeight: screenHeight * 0.4, // Ensure it's visible on smaller screens
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
    height: 40, // Add some space at the bottom for better scrollability
  },
});
