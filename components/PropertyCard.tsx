import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    location: string;
    price: number;
    priceLabel: string;
    dimension: string;
    facing: string;
    imageUrls: string[];
    status: string;
    landNumber: string;
  };
}

const { width } = Dimensions.get("window");

const PropertyCard = ({ property }: PropertyCardProps) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "ADVANCE":
        return "bg-yellow-100 text-yellow-800";
      case "SOLD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/plot/${property.id}`)}
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
    >
      {/* Property Image */}
      <Image
        source={{
          uri: property.imageUrls[0] || "https://via.placeholder.com/400x200",
        }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Property Info */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold flex-1 mr-2">
            {property.title}
          </Text>
          <View
            className={`px-2 py-1 rounded-full ${getStatusColor(
              property.status
            )}`}
          >
            <Text className="text-xs font-semibold">{property.status}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text className="text-gray-600 ml-1 flex-1">{property.location}</Text>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-orange-600 font-semibold">
            ₹{property.price.toLocaleString()}
          </Text>
          <Text className="text-gray-500 text-sm">{property.priceLabel}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="resize-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-1">{property.dimension}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="compass-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-1">{property.facing}</Text>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-gray-700">
            Land Number:{" "}
            <Text className="font-semibold">{property.landNumber}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
