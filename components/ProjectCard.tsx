import { getProjects, ProjectType } from "@/lib/api"; // Import the API function and type
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const ProjectCard = () => {
  const router = useRouter();
  const [featuredProjects, setFeaturedProjects] = useState<ProjectType[]>([]); // State to hold projects

  useEffect(() => {
    const fetchProjects = async () => {
      const projects = await getProjects(); // Fetch projects from API
      setFeaturedProjects(projects); // Update state with fetched data
    };

    fetchProjects();
  }, []); // Empty dependency array to run once on mount

  return (
    <ScrollView
      
      showsVerticalScrollIndicator={false}
      className="py-4"
    >
      {featuredProjects.map((project: ProjectType) => (
        <TouchableOpacity
          key={project.id}
          onPress={() => router.push(`/Explore` as any)}
          className="w-96 mb-4 bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Image Container */}
          <View className="relative w-full">
            <Image
              source={{ uri: project.imageUrl }}
              className="w-full h-64 rounded-t-xl"
              resizeMode="cover"
            />
            {/* Price Tag */}
            <View className="absolute right-3 top-3 bg-green-500 rounded-full px-3 py-1">
              <Text className="text-white text-sm font-semibold">
                $ 15
              </Text>
            </View>
            {/* Favorite Icon */}
            <TouchableOpacity className="absolute top-3 right-3">
              <View className="bg-white rounded-full p-1.5">
                <Ionicons name="heart-outline" size={20} color="#6B7280" />
              </View>
              
            </TouchableOpacity>
            <View className="p-3 flex  rounded-2xl left-3 right-3 absolute bg-white  bottom-3 justify-center">
            <Text className="text-xl font-manrope-medium text-gray-900" numberOfLines={2}>
              {project.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="ml-1 text-sm font-manrope text-gray-500">{project.location}</Text>
            </View>
          </View>
          </View>

          {/* Card Details */}
        
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ProjectCard;
