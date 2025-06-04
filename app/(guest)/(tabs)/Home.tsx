import InputField from "@/components/InputField";
import ProjectCard from "@/components/ProjectCard";
import { getProjects } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  AccessibilityInfo,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

interface ProjectType {
  id: string;
  name?: string;
  description?: string;
  city?: string;
  state?: string;
}

interface FilterState {
  city: string[];
  state: string[];
}

interface UserMetadata {
  role?: "guest" | "client" | "manager";
}

export default function Page() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [filters, setFilters] = useState<FilterState>({
    city: [],
    state: [],
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const filterSlideAnim = useState(new Animated.Value(height))[0];

  const filterOptions = {
    city: [
      { label: "Bengaluru", value: "bengaluru", count: 15 },
      { label: "Chennai", value: "chennai", count: 12 },
      { label: "Hyderabad", value: "hyderabad", count: 10 },
      { label: "Coimbatore", value: "coimbatore", count: 8 },
      { label: "Kochi", value: "kochi", count: 7 },
      { label: "Mysuru", value: "mysuru", count: 6 },
      { label: "Thiruvananthapuram", value: "thiruvananthapuram", count: 5 },
      { label: "Mangaluru", value: "mangaluru", count: 4 },
      { label: "Delhi", value: "delhi", count: 14 },
      { label: "Mumbai", value: "mumbai", count: 13 },
      { label: "Kolkata", value: "kolkata", count: 9 },
      { label: "Pune", value: "pune", count: 11 },
    ],
    state: [
      { label: "Karnataka", value: "karnataka", count: 20 },
      { label: "Tamil Nadu", value: "tamil_nadu", count: 18 },
      { label: "Telangana", value: "telangana", count: 15 },
      { label: "Andhra Pradesh", value: "andhra_pradesh", count: 12 },
      { label: "Kerala", value: "kerala", count: 10 },
      { label: "Maharashtra", value: "maharashtra", count: 22 },
      { label: "Delhi", value: "delhi", count: 14 },
      { label: "West Bengal", value: "west_bengal", count: 9 },
    ],
  };

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getProjects();
      if (!Array.isArray(data)) throw new Error("Invalid project data");
      setProjects(data.filter(project => project?.id));
      if (Platform.OS !== "web" && AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility("Projects loaded successfully");
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please check your connection and try again.");
      if (Platform.OS !== "web" && AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility("Error loading projects");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchProjects();
      if (Platform.OS !== "web" && AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility("Projects refreshed successfully");
      }
    } catch (err) {
      setError("Failed to refresh projects. Please try again.");
      if (Platform.OS !== "web" && AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility("Error refreshing projects");
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchProjects, refreshing]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        [
          project.name?.toLowerCase(),
          project.description?.toLowerCase(),
          project.city?.toLowerCase(),
          project.state?.toLowerCase(),
        ].some(field => field?.includes(searchQuery.toLowerCase()))
      );
    }

    if (filters.city.length > 0) {
      filtered = filtered.filter(project => 
        project.city && filters.city.includes(project.city.toLowerCase())
      );
    }

    if (filters.state.length > 0) {
      filtered = filtered.filter(project => 
        project.state && filters.state.includes(project.state.toLowerCase())
      );
    }

    return filtered;
  }, [projects, searchQuery, filters]);

  const getActiveFilterCount = useCallback(() => {
    return filters.city.length + filters.state.length;
  }, [filters]);

  const clearAllFilters = useCallback(() => {
    setFilters({ city: [], state: [] });
    if (Platform.OS !== "web" && AccessibilityInfo.announceForAccessibility) {
      AccessibilityInfo.announceForAccessibility("All filters cleared");
    }
  }, []);

  const toggleFilter = useCallback((type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value],
    }));
  }, []);

  const animateFilterModal = useCallback((show: boolean) => {
    Animated.timing(filterSlideAnim, {
      toValue: show ? 0 : height,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const SkeletonLoader = () => (
    <View className="flex-1">
      {[...Array(3)].map((_, index) => (
        <View
          key={index}
          className="mb-4 p-4 bg-gray-100 rounded-2xl overflow-hidden"
        >
          <View className="h-6 bg-gray-200 rounded w-3/4 mb-2 relative overflow-hidden">
            <View className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </View>
          <View className="h-4 bg-gray-200 rounded w-1/2 relative overflow-hidden">
            <View className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </View>
        </View>
      ))}
    </View>
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    animateFilterModal(showFilters);
  }, [showFilters, animateFilterModal]);

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-4 text-gray-600 text-lg font-system">
          Initializing...
        </Text>
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    const userRole = (user?.publicMetadata as UserMetadata)?.role;
    if (userRole === "client") return <Redirect href="/(client)/(tabs)/Home" />;
    if (userRole === "manager") return <Redirect href="/(manager)" />;
  }

  const FilterCheckbox = ({ label, value, isSelected, onPress, count }: {
    label: string;
    value: string;
    isSelected: boolean;
    onPress: () => void;
    count?: number;
  }) => (
    <TouchableOpacity
      accessible
      accessibilityLabel={`${label} filter${isSelected ? ", selected" : ""}`}
      accessibilityRole="checkbox"
      onPress={onPress}
      className="flex-row items-center justify-between py-3 px-5"
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-6 h-6 rounded-lg border-2 mr-3 items-center justify-center ${
          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
        }`}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text className="text-base font-system text-gray-900">
          {label}
        </Text>
      </View>
      {count != null && (
        <Text className="text-sm font-system text-gray-500">
          ({count})
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View className="bg-white/80 shadow-sm backdrop-blur-lg">
        <View className="px-5 pt-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-system-bold text-gray-900 tracking-tight">
                Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
              </Text>
              <Text className="text-sm font-system text-gray-500 mt-1">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity
              accessible
              accessibilityLabel="Notifications"
              onPress={() => {
                // TODO: Implement notifications
              }}
              className="p-2 rounded-full bg-gray-100"
            >
              <Ionicons name="notifications-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View className="mt-3">
            <InputField
              label=""
              placeholder="Search projects, cities, states..."
              icon="search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search projects"
              className="bg-gray-100 rounded-2xl text-base font-system text-gray-900 shadow-sm"
            />
          </View>

          <View className="flex-row items-center justify-between mt-3 pb-3">
            <TouchableOpacity
              accessible
              accessibilityLabel={`Filters, ${getActiveFilterCount()} active`}
              onPress={() => {
                setShowFilters(true);
              }}
              className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full"
            >
              <Ionicons name="filter" size={18} color="#666" />
              <Text className="text-base font-system-medium ml-2 text-gray-600">
                Filters
                {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
              </Text>
            </TouchableOpacity>
            <View />
          </View>

          {getActiveFilterCount() > 0 && (
            <View className="pb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-5"
              >
                <View className="flex-row items-center">
                  {filters.city.map((city) => (
                    <View
                      key={city}
                      className="bg-blue-100 px-3 py-1 rounded-full mr-2 flex-row items-center"
                    >
                      <Text className="text-sm font-system-medium text-blue-600">
                        {filterOptions.city.find(c => c.value === city)?.label}
                      </Text>
                      <TouchableOpacity
                        accessible
                        accessibilityLabel={`Remove ${city} filter`}
                        onPress={() => {
                          toggleFilter("city", city);
                        }}
                        className="ml-2"
                      >
                        <Ionicons name="close" size={14} color="#2563eb" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {filters.state.map((state) => (
                    <View
                      key={state}
                      className="bg-purple-100 px-3 py-1 rounded-full mr-2 flex-row items-center"
                    >
                      <Text className="text-sm font-system-medium text-purple-600">
                        {filterOptions.state.find(s => s.value === state)?.label}
                      </Text>
                      <TouchableOpacity
                        accessible
                        accessibilityLabel={`Remove ${state} filter`}
                        onPress={() => {
                          toggleFilter("state", state);
                        }}
                        className="ml-2"
                      >
                        <Ionicons name="close" size={14} color="#7c3aed" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    accessible
                    accessibilityLabel="Clear all filters"
                    onPress={() => {
                      clearAllFilters();
                    }}
                    className="bg-red-100 px-3 py-1 rounded-full ml-2"
                  >
                    <Text className="text-sm font-system-medium text-red-600">
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1e3a8a"]}
            tintColor="#1e3a8a"
            accessibilityLabel="Refresh projects"
          />
        }
      >
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="alert-circle" size={48} color="#dc2626" />
            <Text className="text-lg font-system-bold mt-2 text-red-500">
              Oops!
            </Text>
            <Text className="text-center mt-2 px-8 text-base font-system text-gray-600">
              {error}
            </Text>
            <TouchableOpacity
              accessible
              accessibilityLabel="Retry loading projects"
              onPress={() => {
                fetchProjects();
              }}
              className="mt-4 px-8 py-3 rounded-xl bg-blue-500 shadow-lg"
            >
              <Text className="text-white font-system-medium text-base">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="folder-open" size={48} color="#9ca3af" />
            <Text className="text-xl font-system-bold mt-4 text-gray-700">
              {getActiveFilterCount() > 0 || searchQuery
                ? "No Matches Found"
                : "No Projects Yet"}
            </Text>
            <Text className="text-base font-system text-center mt-2 px-8 text-gray-500">
              {getActiveFilterCount() > 0 || searchQuery
                ? "Try adjusting your filters or search terms."
                : "Projects will appear here once they're created."}
            </Text>
            {(getActiveFilterCount() > 0 || searchQuery) && (
              <TouchableOpacity
                accessible
                accessibilityLabel="Clear all filters and search"
                onPress={() => {
                  setSearchQuery("");
                  clearAllFilters();
                }}
                className="mt-4 px-6 py-2 rounded-xl bg-blue-500"
              >
                <Text className="text-white font-system-medium text-base">
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View className="flex-row justify-between items-center py-4">
              <Text className="text-lg font-system-bold text-gray-800">
                {filteredProjects.length} Projects Found
              </Text>
            </View>
            {filteredProjects.map((project, index) => (
              <Animated.View
                key={project.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 20 * index],
                      }),
                    },
                  ],
                }}
                className="mb-4"
              >
                <ProjectCard
                  project={project}
                  viewMode="list"
                  isDarkMode={false}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <Modal
        visible={showFilters}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilters(false)}
        accessible
        accessibilityLabel="Filter projects modal"
      >
        <View className="flex-1 bg-black/60">
          <Animated.View
            style={{ transform: [{ translateY: filterSlideAnim }], flex: 1 }}
            className="bg-white/95 rounded-t-3xl mt-20 backdrop-blur-lg"
          >
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200/20">
              <View className="flex-row items-center">
                <Text className="text-xl font-system-bold text-gray-900">
                  Filters
                </Text>
                {getActiveFilterCount() > 0 && (
                  <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                    <Text className="text-white text-xs font-system-bold">
                      {getActiveFilterCount()}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                accessible
                accessibilityLabel="Close filter modal"
                onPress={() => {
                  setShowFilters(false);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              <View className="border-b border-gray-200/20">
                <View className="px-5 py-3 bg-gray-50">
                  <Text className="text-base font-system-medium text-gray-800">
                    CITY
                  </Text>
                </View>
                {filterOptions.city.map((option) => (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    count={option.count}
                    isSelected={filters.city.includes(option.value)}
                    onPress={() => {
                      toggleFilter("city", option.value);
                    }}
                  />
                ))}
              </View>

              <View className="border-b border-gray-200/20">
                <View className="px-5 py-3 bg-gray-50">
                  <Text className="text-base font-system-medium text-gray-800">
                    STATE
                  </Text>
                </View>
                {filterOptions.state.map((option) => (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    count={option.count}
                    isSelected={filters.state.includes(option.value)}
                    onPress={() => {
                      toggleFilter("state", option.value);
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            <View className="flex-row p-5 border-t border-gray-200/20">
              <TouchableOpacity
                accessible
                accessibilityLabel="Clear all filters"
                onPress={() => {
                  clearAllFilters();
                }}
                className="flex-1 border border-blue-500 rounded-xl py-3 mr-2"
              >
                <Text className="text-center text-base font-system-medium text-blue-500">
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessible
                accessibilityLabel="Apply filters"
                onPress={() => {
                  setShowFilters(false);
                }}
                className="flex-1 bg-blue-500 rounded-xl py-3 ml-2"
              >
                <Text className="text-white text-center text-base font-system-medium">
                  Apply Filters {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
