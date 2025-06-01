import InputField from "@/components/InputField";
import ProjectCard from "@/components/ProjectCard";
import { getProjects, ProjectType } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type SortOption = "newest" | "oldest" | "name" | "status" | "priority" | "deadline";
type FilterOption = "all" | "active" | "completed" | "pending" | "draft" | "cancelled";

interface FilterState {
  status: FilterOption[];
  priority: string[];
  dateRange: string;
  client: string[];
  budget: { min: number; max: number };
}

export default function Page() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Enhanced Filter State
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    dateRange: "",
    client: [],
    budget: { min: 0, max: 100000 }
  });

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-50))[0];
  const filterSlideAnim = useState(new Animated.Value(height))[0];

  // Sample data for filters (in real app, this would come from API)
  const filterOptions = {
    status: [
      { label: "Active", value: "active", count: 12 },
      { label: "Completed", value: "completed", count: 8 },
      { label: "Pending", value: "pending", count: 5 },
      { label: "Draft", value: "draft", count: 3 },
      { label: "Cancelled", value: "cancelled", count: 2 }
    ],
    priority: [
      { label: "High", value: "high", count: 7 },
      { label: "Medium", value: "medium", count: 15 },
      { label: "Low", value: "low", count: 8 }
    ],
    dateRange: [
      { label: "Last 7 days", value: "7days" },
      { label: "Last 30 days", value: "30days" },
      { label: "Last 3 months", value: "3months" },
      { label: "Last 6 months", value: "6months" },
      { label: "This year", value: "year" }
    ],
    clients: [
      { label: "TechCorp Inc.", value: "techcorp", count: 5 },
      { label: "StartupXYZ", value: "startupxyz", count: 3 },
      { label: "Enterprise Ltd", value: "enterprise", count: 8 },
      { label: "Innovation Co", value: "innovation", count: 4 }
    ]
  };

  const fetchProjects = async () => {
    try {
      setError(null);
      const data = await getProjects();
      setProjects(data);
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  // Enhanced filter and sort logic
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(project => 
        filters.status.includes(project.status as FilterOption)
      );
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(project => 
        filters.priority.includes(project.priority || "medium")
      );
    }

    // Apply client filter
    if (filters.client.length > 0) {
      filtered = filtered.filter(project => 
        filters.client.some(client => 
          project.client?.toLowerCase().includes(client.toLowerCase())
        )
      );
    }

    // Apply budget filter
    filtered = filtered.filter(project => {
      const budget = project.budget || 0;
      return budget >= filters.budget.min && budget <= filters.budget.max;
    });

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case "7days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6months":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(project => 
        new Date(project.createdAt || 0) >= cutoffDate
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                   (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case "deadline":
          return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, sortBy, filters]);

  const getProjectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === "active" || p.status === "in_progress").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const pending = projects.filter(p => p.status === "pending" || p.status === "draft").length;
    
    return { total, active, completed, pending };
  }, [projects]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status.length > 0) count += filters.status.length;
    if (filters.priority.length > 0) count += filters.priority.length;
    if (filters.client.length > 0) count += filters.client.length;
    if (filters.dateRange) count += 1;
    if (filters.budget.min > 0 || filters.budget.max < 100000) count += 1;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      priority: [],
      dateRange: "",
      client: [],
      budget: { min: 0, max: 100000 }
    });
  };

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const animateFilterModal = (show: boolean) => {
    Animated.timing(filterSlideAnim, {
      toValue: show ? 0 : height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    animateFilterModal(showFilters);
  }, [showFilters]);

  // Wait for both auth and user data to load
  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <View className="items-center">
          <ActivityIndicator size="large" color="#fb6e14" />
          <Text className="mt-4 text-gray-600 text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Role-based redirects
  if (isSignedIn) {
    const userRole = user?.publicMetadata?.role as
      | "guest"
      | "client"
      | "manager"
      | undefined;

    if (userRole === "client") {
      return <Redirect href="/(client)/(tabs)/Home" />;
    }
    if (userRole === "manager") {
      return <Redirect href="/(manager)" />;
    }
  }

  const StatsCard = ({ title, count, color, icon }: { title: string; count: number; color: string; icon: string }) => (
    <TouchableOpacity className={`flex-1 p-4 rounded-xl mx-1 ${color} shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">{count}</Text>
          <Text className="text-white text-sm opacity-90">{title}</Text>
        </View>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
    </TouchableOpacity>
  );

  const FilterCheckbox = ({ label, value, isSelected, onPress, count }: {
    label: string;
    value: string;
    isSelected: boolean;
    onPress: () => void;
    count?: number;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-3 px-4 border-b border-gray-100"
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300"
        }`}>
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <Text className="text-gray-700 flex-1">{label}</Text>
      </View>
      {count !== undefined && (
        <Text className="text-gray-400 text-sm">({count})</Text>
      )}
    </TouchableOpacity>
  );

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black bg-opacity-50 justify-end"
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-800">Sort Projects</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {[
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
            { label: "Name (A-Z)", value: "name" },
            { label: "Status", value: "status" },
            { label: "Priority", value: "priority" },
            { label: "Deadline", value: "deadline" }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setSortBy(option.value as SortOption);
                setShowSortModal(false);
              }}
              className="flex-row items-center justify-between py-4"
            >
              <Text className="text-gray-700 text-lg">{option.label}</Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={20} color="#fb6e14" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Enhanced Header */}
      <View className="bg-white shadow-sm">
        {/* Welcome Section */}
        <View className="px-4 pt-4 pb-0"> {/* Changed pb-1 to pb-0 */}
          <Text className="text-2xl font-bold text-gray-800">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </Text>
          <Text className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-2"> {/* Changed pb-4 to pb-2 */}
          <InputField 
            label="" 
            placeholder="Search projects, clients..." 
            icon="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Bar */}
        <View className="flex-row items-center justify-between px-4 pb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full mr-3"
            >
              <Ionicons name="filter" size={16} color="#666" />
              <Text className="text-gray-600 ml-2 font-medium">
                Filters{getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full mr-3"
            >
              <Ionicons name="swap-vertical" size={16} color="#666" />
              <Text className="text-gray-600 ml-2 font-medium">Sort</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="p-2 rounded-full bg-gray-100 mr-2"
            >
              <Ionicons 
                name={viewMode === "list" ? "grid" : "list"} 
                size={18} 
                color="#666" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity className="p-2 rounded-full bg-gray-100">
              <Ionicons name="notifications-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Removed Stats Cards Section */}
        {/*
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-4">
          <StatsCard title="Total" count={getProjectStats.total} color="bg-blue-500" icon="folder" />
          <StatsCard title="Active" count={getProjectStats.active} color="bg-green-500" icon="play-circle" />
          <StatsCard title="Completed" count={getProjectStats.completed} color="bg-purple-500" icon="checkmark-circle" />
          <StatsCard title="Pending" count={getProjectStats.pending} color="bg-orange-500" icon="time" />
        </ScrollView>
        */}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <View className="px-4 pb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center">
                {filters.status.map((status) => (
                  <View key={status} className="bg-orange-100 px-3 py-1 rounded-full mr-2 flex-row items-center">
                    <Text className="text-orange-600 text-sm font-medium">{status}</Text>
                    <TouchableOpacity
                      onPress={() => toggleFilter('status', status)}
                      className="ml-2"
                    >
                      <Ionicons name="close" size={14} color="#fb6e14" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {filters.priority.map((priority) => (
                  <View key={priority} className="bg-blue-100 px-3 py-1 rounded-full mr-2 flex-row items-center">
                    <Text className="text-blue-600 text-sm font-medium">{priority}</Text>
                    <TouchableOpacity
                      onPress={() => toggleFilter('priority', priority)}
                      className="ml-2"
                    >
                      <Ionicons name="close" size={14} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  onPress={clearAllFilters}
                  className="bg-red-100 px-3 py-1 rounded-full ml-2"
                >
                  <Text className="text-red-600 text-sm font-medium">Clear All</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Projects List */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#fb6e14"]}
            tintColor="#fb6e14"
          />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color="#fb6e14" />
            <Text className="mt-4 text-gray-500">Loading projects...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text className="text-red-500 text-center mb-2 text-lg font-semibold">Oops!</Text>
            <Text className="text-gray-600 text-center mb-6 px-8">{error}</Text>
            <TouchableOpacity
              onPress={fetchProjects}
              className="bg-orange-500 px-8 py-3 rounded-xl shadow-sm"
            >
              <Text className="text-white font-semibold text-lg">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAndSortedProjects.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="folder-open" size={48} color="#9ca3af" />
            <Text className="text-xl font-semibold text-gray-700 mt-4">
              {getActiveFilterCount() > 0 || searchQuery ? "No matches found" : "No projects yet"}
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              {getActiveFilterCount() > 0 || searchQuery
                ? "Try adjusting your filters or search terms."
                : "Projects will appear here once they're created."
              }
            </Text>
            {(getActiveFilterCount() > 0 || searchQuery) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  clearAllFilters();
                }}
                className="mt-4 px-6 py-2 bg-orange-500 rounded-lg"
              >
                <Text className="text-white font-medium">Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Results Header */}
            <View className="flex-row justify-between items-center py-4">
              <Text className="text-lg font-bold text-gray-800">
                {filteredAndSortedProjects.length} Projects Found
              </Text>
            </View>

            {/* Projects Grid/List */}
            <View className={viewMode === "grid" ? "flex-row flex-wrap justify-between" : ""}>
              {filteredAndSortedProjects.map((project) => (
                <View
                  key={project.id}
                  className={viewMode === "grid" ? "w-[48%] mb-4" : "mb-4"}
                >
                  <ProjectCard project={project} viewMode={viewMode} />
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Flipkart-style Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <Animated.View
            style={{
              transform: [{ translateY: filterSlideAnim }],
              flex: 1,
              marginTop: 100
            }}
            className="bg-white rounded-t-3xl"
          >
            {/* Filter Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-800">Filters</Text>
                {getActiveFilterCount() > 0 && (
                  <View className="bg-orange-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                    <Text className="text-white text-xs font-bold">{getActiveFilterCount()}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {/* Status Filter */}
              <View className="border-b border-gray-100">
                <View className="px-4 py-3 bg-gray-50">
                  <Text className="font-semibold text-gray-800">PROJECT STATUS</Text>
                </View>
                {filterOptions.status.map((option) => (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    count={option.count}
                    isSelected={filters.status.includes(option.value as FilterOption)}
                    onPress={() => toggleFilter('status', option.value)}
                  />
                ))}
              </View>

              {/* Priority Filter */}
              <View className="border-b border-gray-100">
                <View className="px-4 py-3 bg-gray-50">
                  <Text className="font-semibold text-gray-800">PRIORITY</Text>
                </View>
                {filterOptions.priority.map((option) => (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    count={option.count}
                    isSelected={filters.priority.includes(option.value)}
                    onPress={() => toggleFilter('priority', option.value)}
                  />
                ))}
              </View>

              {/* Date Range Filter */}
              <View className="border-b border-gray-100">
                <View className="px-4 py-3 bg-gray-50">
                  <Text className="font-semibold text-gray-800">DATE RANGE</Text>
                </View>
                {filterOptions.dateRange.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: option.value }))}
                    className="flex-row items-center py-3 px-4 border-b border-gray-100"
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      filters.dateRange === option.value ? "border-orange-500" : "border-gray-300"
                    }`}>
                      {filters.dateRange === option.value && (
                        <View className="w-3 h-3 rounded-full bg-orange-500" />
                      )}
                    </View>
                    <Text className="text-gray-700">{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Client Filter */}
              <View className="border-b border-gray-100">
                <View className="px-4 py-3 bg-gray-50">
                  <Text className="font-semibold text-gray-800">CLIENTS</Text>
                </View>
                {filterOptions.clients.map((option) => (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    count={option.count}
                    isSelected={filters.client.includes(option.value)}
                    onPress={() => toggleFilter('client', option.value)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Filter Footer */}
            <View className="flex-row p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={clearAllFilters}
                className="flex-1 border border-orange-500 rounded-lg py-3 mr-2"
              >
                <Text className="text-orange-500 text-center font-semibold">Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                className="flex-1 bg-orange-500 rounded-lg py-3 ml-2"
              >
                <Text className="text-white text-center font-semibold">
                  Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <SortModal />
    </SafeAreaView>
  );
}
