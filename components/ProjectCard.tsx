import { getProjects, ProjectType } from "@/lib/api"; // Import the API function and type
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

const DEFAULT_IMAGE =
  "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

const ProjectCard = () => {
  const router = useRouter();
  const [featuredProjects, setFeaturedProjects] = useState<ProjectType[]>([]); // State to hold projects
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projects = await getProjects(); // Fetch projects from API
      setFeaturedProjects(projects); // Update state with fetched data
    } catch (err) {
      setError("Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const formatPrice = (priceRange?: string) => {
    if (!priceRange) return "Price on request";
    try {
      // Handle different price range formats
      if (priceRange.includes("-")) {
        const minPrice = priceRange.split("-")[0].trim();
        return minPrice;
      }
      return priceRange.trim();
    } catch (err) {
      console.error("Error formatting price:", err);
      return "Price on request";
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-gray-600 font-manrope-medium">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-green-500 px-4 py-2 rounded-full"
          onPress={() => {
            setIsLoading(true);
            setError(null);
            fetchProjects();
          }}
        >
          <Text className="text-white font-manrope-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (featuredProjects.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-gray-600 font-manrope-medium">
          No projects available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="py-4 px-2"
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {featuredProjects.map((project: ProjectType) => (
        <TouchableOpacity
          key={project.id}
          onPress={() => router.push(`/Explore` as any)}
          className="mb-6 bg-white rounded-2xl overflow-hidden"
          style={{
            width: CARD_WIDTH,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Image Container with Gradient Overlay */}
          <View className="relative">
            <Image
              source={{ uri: project.imageUrl || DEFAULT_IMAGE }}
              className="w-full h-72"
              resizeMode="cover"
              onError={(e) => {
                // If the image fails to load, it will use the DEFAULT_IMAGE
                e.currentTarget.setNativeProps({
                  source: { uri: DEFAULT_IMAGE },
                });
              }}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              className="absolute bottom-0 left-0 right-0 h-32"
            />

            {/* Price Tag */}
            <View className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
              <Text className="text-green-600 text-base font-manrope-bold">
                {formatPrice(project.priceRange)}
              </Text>
            </View>

            {/* Favorite Button */}
            <TouchableOpacity
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="heart-outline" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Card Content */}
          <View className="p-4">
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-xl font-manrope-bold text-gray-900 flex-1 mr-2"
                numberOfLines={1}
              >
                {project.name || "Unnamed Project"}
              </Text>
              <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="ml-1 text-sm font-manrope-medium text-gray-700">
                  {project.rating?.toFixed(1) || "N/A"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text
                className="ml-1 text-sm font-manrope text-gray-600"
                numberOfLines={1}
              >
                {project.location || "Location not specified"}
              </Text>
            </View>

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {project.amenities.slice(0, 3).map((amenity, index) => (
                  <View
                    key={index}
                    className="bg-gray-50 px-3 py-1 rounded-full"
                  >
                    <Text className="text-xs font-manrope-medium text-gray-600">
                      {amenity}
                    </Text>
                  </View>
                ))}
                {project.amenities.length > 3 && (
                  <View className="bg-gray-50 px-3 py-1 rounded-full">
                    <Text className="text-xs font-manrope-medium text-gray-600">
                      +{project.amenities.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Available Plots */}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-sm font-manrope-medium text-gray-700">
                  {project.plotsAvailable} Available
                </Text>
              </View>
              <TouchableOpacity
                className="bg-green-500 px-4 py-2 rounded-full"
                onPress={() => router.push(`/Explore` as any)}
              >
                <Text className="text-white font-manrope-bold text-sm">
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ProjectCard;
