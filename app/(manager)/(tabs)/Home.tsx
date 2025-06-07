import { useState, useEffect } from "react";
import { 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  Platform
} from "react-native";
import { 
  Card, 
  Title, 
  Text, 
  DataTable, 
  ActivityIndicator, 
  Avatar, 
  IconButton,
  Surface
} from "react-native-paper";
import { 
  LineChart, 
  BarChart, 
  PieChart 
} from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SignOutButton } from "@/components/SignOutButton";
import { 
  getProjects, 
  getAllPlots, 
  getVisitRequests, 
  getUserFeedback,
  ProjectType, 
  PlotType, 
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

export default function ManagerHomeTabScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
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
  const [feedback, setFeedback] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [projectsData, plotsData, visitsData, feedbackData] = await Promise.all([
        getProjects(),
        getAllPlots(),
        getVisitRequests(),
        getUserFeedback("manager-clerk-id")
      ]);

      // Calculate statistics with safe defaults
      const availablePlots = plotsData?.filter(p => p.status === "AVAILABLE").length || 0;
      const pendingVisits = visitsData?.filter(v => v.status === "PENDING").length || 0;
      const avgRating = feedbackData?.length ? 
        feedbackData.reduce((sum: number, f) => sum + (f.rating || 0), 0) / feedbackData.length : 0;
      const recentSales = plotsData?.filter(p => 
        p.status === "SOLD" && 
        new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        projects: projectsData?.length || 0,
        plots: plotsData?.length || 0,
        availablePlots,
        visitRequests: visitsData?.length || 0,
        pendingVisits,
        avgRating,
        recentSales,
      });

      setProjects(projectsData || []);
      setPlots(plotsData || []);
      setVisits(visitsData || []);
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Set empty states on error
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
      setFeedback([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // Safe chart data preparation with fallbacks
  const priceDistribution = projects.length ? projects.map(project => {
    const projectPlots = plots.filter(p => p.projectId === project.id);
    const avgPrice = projectPlots.length ? 
      projectPlots.reduce((sum, p) => sum + (p.price || 0), 0) / projectPlots.length : 0;
    return {
      name: project.name || 'Unnamed Project',
      price: avgPrice,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      legendFontColor: "#8E8E93",
      legendFontSize: 12
    };
  }) : [{
    name: 'No Data',
    price: 0,
    color: '#E5E5EA',
    legendFontColor: "#8E8E93",
    legendFontSize: 12
  }];

  const visitTrends = Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return visits.filter(v => 
      new Date(v.date).toDateString() === date.toDateString()
    ).length;
  });

  const statusDistribution = [
    {
      name: "Available",
      count: plots.filter(p => p.status === "AVAILABLE").length,
      color: "#34C759",
      legendFontColor: "#8E8E93",
      legendFontSize: 12
    },
    {
      name: "Reserved",
      count: plots.filter(p => p.status === "RESERVED").length,
      color: "#FF9500",
      legendFontColor: "#8E8E93",
      legendFontSize: 12
    },
    {
      name: "Sold",
      count: plots.filter(p => p.status === "SOLD").length,
      color: "#FF3B30",
      legendFontColor: "#8E8E93",
      legendFontSize: 12
    }
  ];

  const topProjects = projects.length ? [...projects]
    .sort((a, b) => 
      plots.filter(p => p.projectId === b.id && p.status === "SOLD").length - 
      plots.filter(p => p.projectId === a.id && p.status === "SOLD").length
    )
    .slice(0, 3) : [];

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
    style: {
      borderRadius: BORDER_RADIUS
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#007AFF"
    }
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
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Avatar.Text 
              size={40} 
              label="M" 
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </TouchableOpacity>
        </View>

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
        {statusDistribution.some(s => s.count > 0) && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Property Distribution</Text>
              <TouchableOpacity>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <PieChart
              data={statusDistribution}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={true}
            />
          </Surface>
        )}

        {visitTrends.some(v => v > 0) && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Visit Trends</Text>
              <Text style={styles.cardSubtitle}>Last 7 days</Text>
            </View>
            <LineChart
              data={{
                labels: ["6d", "5d", "4d", "3d", "2d", "1d", "Today"],
                datasets: [
                  {
                    data: visitTrends.length ? visitTrends : [0],
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                    strokeWidth: 3
                  }
                ]
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Surface>
        )}

        {priceDistribution.length > 1 && (
          <Surface style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Average Plot Prices</Text>
              <Text style={styles.cardSubtitle}>By project</Text>
            </View>
            <BarChart
              data={{
                labels: priceDistribution.map(p => 
                  p.name.length > 8 ? p.name.substring(0, 8) + "..." : p.name
                ),
                datasets: [
                  {
                    data: priceDistribution.map(p => p.price)
                  }
                ]
              }}
              width={screenWidth - 64}
              height={220}
              yAxisLabel="$"
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </Surface>
        )}

        {/* Top Projects */}
        {topProjects.length > 0 && (
          <Surface style={styles.sectionCard}>
            <View style={styles.cardHeader}>
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

              {topProjects.map((project, index) => {
                const projectPlots = plots.filter(p => p.projectId === project.id);
                const soldPlots = projectPlots.filter(p => p.status === "SOLD").length;
                
                return (
                  <DataTable.Row key={project.id} style={styles.tableRow}>
                    <DataTable.Cell textStyle={styles.tableCellText}>
                      {project.name}
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
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Visit Requests</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {visits.slice(0, 3).map((visit) => (
              <TouchableOpacity key={visit.id} style={styles.visitItem}>
                <Avatar.Text 
                  size={44} 
                  label={visit.user?.name?.split(" ").map(n => n[0]).join("") || "V"} 
                  style={styles.visitAvatar}
                  labelStyle={styles.visitAvatarLabel}
                />
                <View style={styles.visitDetails}>
                  <Text style={styles.visitName}>
                    {visit.user?.name || visit.name || 'Unknown Visitor'}
                  </Text>
                  <Text style={styles.visitPlot}>
                    {visit.plot?.title || 'Unknown Plot'}
                  </Text>
                  <Text style={styles.visitDate}>
                    {new Date(visit.date).toLocaleDateString()} at {visit.time}
                  </Text>
                </View>
                <View style={[
                  styles.visitStatus,
                  { 
                    backgroundColor: 
                      visit.status === "APPROVED" ? "#34C759" :
                      visit.status === "PENDING" ? "#FF9500" :
                      visit.status === "REJECTED" ? "#FF453A" : "#8E8E93"
                  }
                ]}>
                  <Text style={styles.visitStatusText}>{visit.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Surface>
        )}

        {/* Empty State */}
        {projects.length === 0 && plots.length === 0 && visits.length === 0 && (
          <Surface style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="chart-line" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Pull down to refresh and load your dashboard data
            </Text>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: (screenWidth - 60) / 2,
    marginRight: 10,
    marginBottom: 12,
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
    backgroundColor: "#F2F2F7",
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
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    ...SHADOW_CONFIG,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    ...SHADOW_CONFIG,
    overflow: "hidden",
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
  chart: {
    borderRadius: BORDER_RADIUS,
  },
  dataTable: {
    backgroundColor: "transparent",
  },
  tableHeader: {
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  tableRow: {
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  visitAvatar: {
    backgroundColor: "#E5E5EA",
  },
  visitAvatarLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  visitDetails: {
    flex: 1,
    marginLeft: 16,
  },
  visitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  visitPlot: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 2,
  },
  visitDate: {
    fontSize: 13,
    color: "#8E8E93",
  },
  visitStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  visitStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyStateCard: {
    marginHorizontal: 20,
    marginTop: 40,
    padding: 40,
    borderRadius: BORDER_RADIUS,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    ...SHADOW_CONFIG,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});
