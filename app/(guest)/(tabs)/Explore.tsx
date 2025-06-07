import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllPlots, PlotType } from "../../../lib/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32; // 16px padding on each side
const DEFAULT_IMAGE =
  "https://placehold.co/600x400/e2e8f0/64748b?text=Plot+Image";

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [plots, setPlots] = useState<PlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPlots();
      setPlots(data);
    } catch (err) {
      setError("Failed to load plots. Please try again later.");
      console.log("Error fetching plots:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlots = plots.filter(
    (plot) =>
      plot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToPlot = (plotId: string) => {
    router.push(`/plot/${plotId}`);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(2)} Lac`;
  };

  const renderPlotItem = ({ item }: { item: PlotType }) => (
    <TouchableOpacity
      onPress={() => navigateToPlot(item.id)}
      className="mb-6"
      style={{ width: CARD_WIDTH }}
    >
      <View className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        {/* Image Container with Gradient Overlay */}
        <View className="relative h-48">
          <Image
            source={{ uri: item.imageUrls?.[0] || DEFAULT_IMAGE }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            className="absolute bottom-0 left-0 right-0 h-20"
          />

          {/* Status Badge */}
          <View
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full ${
              item.status.toLowerCase() === "available"
                ? "bg-green-500/90"
                : "bg-red-500/90"
            }`}
          >
            <Text className="text-white text-xs font-semibold capitalize">
              {item.status.toLowerCase() === "available"
                ? "Available"
                : "Sold Out"}
            </Text>
          </View>

          {/* Price Tag */}
          <View className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-lg">
            <Text className="text-orange-600 font-bold text-lg">
              {formatPrice(item.price)}
            </Text>
            <Text className="text-gray-600 text-xs">Onwards</Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-5">
          {/* Title and Location */}
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {item.title}
          </Text>
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#FF6B00" />
            <Text className="text-gray-600 ml-1 text-sm">{item.location}</Text>
          </View>

          {/* Details Grid */}
          <View className="flex-row flex-wrap gap-4 mb-4">
            <View className="flex-row items-center bg-orange-50 px-3 py-2 rounded-lg">
              <Ionicons name="resize-outline" size={16} color="#FF6B00" />
              <Text className="text-gray-700 ml-2 text-sm font-medium">
                {item.dimension}
              </Text>
            </View>

            <View className="flex-row items-center bg-orange-50 px-3 py-2 rounded-lg">
              <Ionicons name="compass-outline" size={16} color="#FF6B00" />
              <Text className="text-gray-700 ml-2 text-sm font-medium capitalize">
                {item.facing}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          {item.amenities && item.amenities.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {item.amenities.slice(0, 3).map((amenity, index) => (
                <View
                  key={index}
                  className="bg-gray-50 px-2.5 py-1 rounded-full"
                >
                  <Text className="text-gray-600 text-xs">{amenity}</Text>
                </View>
              ))}
              {item.amenities.length > 3 && (
                <View className="bg-gray-50 px-2.5 py-1 rounded-full">
                  <Text className="text-gray-600 text-xs">
                    +{item.amenities.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity
            onPress={() => navigateToPlot(item.id)}
            className="mt-4 bg-orange-500 py-3 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4 text-gray-600 font-medium">Loading plots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B00" />
        <Text className="text-gray-700 mt-4 text-center text-lg font-medium">
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchPlots}
          className="mt-6 px-6 py-3 bg-orange-500 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="p-4 bg-white">
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
          <Ionicons name="search-outline" size={20} color="#FF6B00" />
          <TextInput
            placeholder="Search by plot name or location"
            className="ml-2 flex-1 text-gray-800 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPlots}
        renderItem={renderPlotItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="search" size={64} color="#FFB380" />
            <Text className="mt-4 text-xl font-semibold text-gray-700">
              No plots found
            </Text>
            <Text className="mt-2 text-gray-500 text-center">
              Try searching with different keywords
            </Text>
          </View>
        }
      />
    </View>
  );
}
