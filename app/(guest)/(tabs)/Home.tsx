import InputField from "@/components/InputField";
import ProjectCard from "@/components/ProjectCard";
import { getProjects, ProjectType } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Wait for both auth and user data to load
  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#fb6e14" />
      </SafeAreaView>
    );
  }

  // If signed in and user data is loaded, check the role and potentially redirect
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Search and Notifications */}
      <View className="flex-row items-center justify-between px-4 py-1">
        <View className="flex-1 mr-3">
          <InputField label="" placeholder="Search" icon={"search"} />
        </View>
        <View className="p-2 mt-8 rounded-full border border-gray-500">
          <Ionicons name="notifications-outline" size={24} color="#666" />
        </View>
      </View>

      {/* Projects List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#fb6e14" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={fetchProjects}
              className="bg-orange-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : projects.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-500 text-center">
              No projects available at the moment
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Featured Projects
            </Text>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
