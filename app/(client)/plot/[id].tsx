// app/(guest)/plots/[id].tsx or app/plots/[id].tsx

import LandGrid from "@/components/LandGrid";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getLandsByPlotId, getPlotById, PlotType } from "../../../lib/api";
import BuyRequestModal from "@/components/BuyRequestModal";

const { width } = Dimensions.get("window");

interface BuyRequestForm {
  name: string;
  phone: string;
  message: string;
  selectedLandId: string | null;
}

export default function PlotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [showBuyRequestModal, setShowBuyRequestModal] = useState(false);
  const [formData, setFormData] = useState<BuyRequestForm>({
    name: user?.fullName || "",
    phone: user?.phoneNumbers[0]?.phoneNumber || "",
    message: "",
    selectedLandId: null,
  });

  const [plot, setPlot] = useState<PlotType | null>(null);
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    const plotId = Array.isArray(id) ? id[0] : id;

    getPlotById(plotId)
      .then((data) => {
        setPlot(data);
        return getLandsByPlotId(plotId);
      })
      .then(setLands)
      .catch((err) => {
        setError(err.message || "Failed to load plot");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={{ width }}>
      <Image
        source={{ uri: item }}
        className="w-full h-80"
        resizeMode="cover"
      />
    </View>
  );

  const availableLands = lands.filter((land) => land.status === "AVAILABLE");

  const handleSubmitRequest = () => {
    if (!formData.selectedLandId) {
      alert("Please select a land");
      return;
    }
    if (!formData.name || !formData.phone) {
      alert("Please fill in all required fields");
      return;
    }
    // TODO: Implement API call to submit buy request
    console.log("Submitting buy request:", formData);
    alert("Buy request submitted successfully!");
    setShowBuyRequestModal(false);
    setFormData({
      name: user?.fullName || "",
      phone: user?.phoneNumbers[0]?.phoneNumber || "",
      message: "",
      selectedLandId: null,
    });
  };



  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" />
        <Text className="mt-2">Loading plot...</Text>
      </View>
    );
  }

  if (!plot || error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-red-500">
          {error || "Plot not found"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-500 mt-2">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Image Carousel */}
        <FlatList
          ref={flatListRef}
          data={plot.imageUrls}
          renderItem={renderImageItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
        />

        {/* Plot Info */}
        <View className="p-4">
          <Text className="text-2xl font-bold">{plot.title}</Text>
          <Text className="text-gray-600 mt-1">{plot.location}</Text>
          <Text className="text-orange-600 mt-2 font-semibold text-lg">
            ₹{plot.price.toLocaleString()} ({plot.priceLabel})
          </Text>
          <Text className="mt-1 text-gray-500">
            {plot.dimension} • {plot.facing}
          </Text>

          {/* Amenities */}
          {plot.amenities?.length > 0 && (
            <View className="mt-4">
              <Text className="text-lg font-semibold mb-2">Amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {plot.amenities.map((a, i) => (
                  <Text
                    key={i}
                    className="bg-orange-100 px-3 py-1 rounded-full text-orange-800 text-sm"
                  >
                    {a}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Lands Section */}
          {lands.length > 0 && (
            <View className="mt-4">
              <Text className="text-lg font-semibold mb-2">
                Land Layout Grid
              </Text>
              <LandGrid
                lands={lands}
                onPressLand={(land) => {
                  alert(`Clicked land ${land.number} (${land.status})`);
                }}
              />
              <View className="flex-row flex-wrap justify-around p-4">
                {[
                  { label: "Available", color: "#22c55e" },
                  { label: "Advance", color: "#facc15" },
                  { label: "Sold", color: "#ef4444" },
                  { label: "Empty", color: "#e5e7eb" },
                ].map((item, i) => (
                  <View key={i} className="flex-row items-center mr-4 mb-2">
                    <View
                      style={{
                        backgroundColor: item.color,
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        marginRight: 6,
                      }}
                    />
                    <Text className="text-gray-700 text-sm">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Buy Request Button */}
          <TouchableOpacity
            onPress={() => setShowBuyRequestModal(true)}
            className="bg-blue-500 p-4 rounded-lg flex-row items-center justify-center mt-4 mb-8"
          >
            <Ionicons name="cart-outline" size={24} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              Request to Buy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Buy Request Modal */}
      <BuyRequestModal
  visible={showBuyRequestModal}
  onClose={() => setShowBuyRequestModal(false)}
  lands={lands}
/>

    </View>
  );
}
