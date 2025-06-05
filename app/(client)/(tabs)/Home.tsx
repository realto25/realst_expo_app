import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { getAllPlots, PlotType } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

const fadeIn = { from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } };

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
      setError("Failed to load plots.");
      console.error("Error fetching plots:", err);
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

  const renderPlotItem = ({ item, index }: { item: PlotType; index: number }) => (
    <Animatable.View animation={fadeIn} duration={300 + index * 100} style={tw`mb-4`}>
      <TouchableOpacity
        onPress={() => navigateToPlot(item.id)}
        style={tw`bg-white rounded-2xl justify-around shadow-sm border border-orange-50`}
      >
        <Image
          source={{ uri: item.imageUrls?.[0] }}
          style={tw`w-full h-40 rounded-t-2xl`}
          resizeMode="cover"
        />
        <View style={tw`p-4`}>
          <View style={tw`flex-row justify-between items-center mb-1`}>
            <Text style={tw`text-lg font-semibold text-gray-800`}>
              ₹{(item.price / 100000).toFixed(2)} Lac
            </Text>
            <Ionicons name="heart-outline" size={20} color="#999" />
          </View>
          <Text style={tw`text-sm font-bold text-gray-700 mb-1`}>{item.title}</Text>
          <Text style={tw`text-sm text-gray-500`}>{item.location}</Text>
          <View style={tw`flex-row items-center mt-2`}>
            <Ionicons name="resize-outline" size={14} color="#f97316" />
            <Text style={tw`text-xs text-gray-600 ml-1`}>{item.dimension}</Text>
          </View>
          <View style={tw`flex-row items-center mt-1`}>
            <Ionicons name="pricetag-outline" size={14} color="#f97316" />
            <Text style={tw`text-xs text-gray-600 ml-1`}>{item.priceLabel}</Text>
          </View>
          <View style={tw`flex-row items-center mt-1`}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#f97316" />
            <Text style={tw`text-xs text-gray-600 ml-1 capitalize`}>
              Status: {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50`} edges={["top", "bottom"]}>
        <Animatable.View animation={fadeIn} duration={300}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={tw`mt-4 text-gray-600 font-medium`}>Loading plots...</Text>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50 px-6`} edges={["top", "bottom"]}>
        <Animatable.View animation={fadeIn} duration={300}>
          <Ionicons name="alert-circle-outline" size={64} color="#f97316" />
          <Text style={tw`text-red-500 mt-4 text-center font-bold`}>{error}</Text>
          <TouchableOpacity
            onPress={fetchPlots}
            style={tw`mt-4 bg-orange-600 rounded-xl px-5 py-3 shadow-sm active:bg-orange-700`}
          >
            <Text style={tw`text-white font-semibold`}>Retry</Text>
          </TouchableOpacity>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-orange-50`} edges={["top", "bottom"]}>
      <Animatable.View animation={fadeIn} duration={300} style={tw`p-4`}>
        <View style={tw`flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-orange-50`}>
          <Ionicons name="search-outline" size={20} color="#f97316" />
          <TextInput
            placeholder="Search Plots"
            style={tw`ml-2 flex-1 text-gray-800`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </Animatable.View>
      <FlatList
        data={filteredPlots}
        renderItem={renderPlotItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`px-4 pb-10`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Animatable.View animation={fadeIn} duration={300} style={tw`items-center justify-center py-20`}>
            <Ionicons name="search-outline" size={64} color="#f97316" />
            <Text style={tw`mt-4 text-lg font-semibold text-gray-600`}>No plots found</Text>
            <Text style={tw`mt-2 text-gray-500`}>Try a different keyword</Text>
          </Animatable.View>
        )}
      />
    </SafeAreaView>
  );
}
