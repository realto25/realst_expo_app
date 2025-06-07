import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
const CARD_WIDTH = width * 0.9;
const DEFAULT_IMAGE =
  "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

const PropertyCard = ({ property }: PropertyCardProps) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: "checkmark-circle",
          iconColor: "#059669",
        };
      case "ADVANCE":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: "time",
          iconColor: "#D97706",
        };
      case "SOLD":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: "checkmark-done-circle",
          iconColor: "#DC2626",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: "help-circle",
          iconColor: "#4B5563",
        };
    }
  };

  const statusStyle = getStatusColor(property.status);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/plot/${property.id}`)}
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
          source={{ uri: property.imageUrls[0] || DEFAULT_IMAGE }}
          className="w-full h-64"
          resizeMode="cover"
          onError={(e) => {
            e.currentTarget.setNativeProps({
              source: { uri: DEFAULT_IMAGE },
            });
          }}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          className="absolute bottom-0 left-0 right-0 h-32"
        />

        {/* Status Badge */}
        <View
          className={`absolute top-4 right-4 flex-row items-center px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.border} border`}
        >
          <Ionicons
            name={statusStyle.icon as any}
            size={16}
            color={statusStyle.iconColor}
          />
          <Text
            className={`ml-1.5 text-sm font-manrope-bold ${statusStyle.text}`}
          >
            {property.status}
          </Text>
        </View>

        {/* Price Tag */}
        <View className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
          <Text className="text-green-600 text-lg font-manrope-bold">
            ₹{property.price.toLocaleString()}
          </Text>
          {property.priceLabel && (
            <Text className="text-green-600 text-xs font-manrope-medium">
              {property.priceLabel}
            </Text>
          )}
        </View>
      </View>

      {/* Card Content */}
      <View className="p-4">
        {/* Title and Land Number */}
        <View className="mb-3">
          <Text
            className="text-xl font-manrope-bold text-gray-900 mb-1"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <View className="flex-row items-center">
            <View className="bg-gray-50 px-2 py-1 rounded-full">
              <Text className="text-xs font-manrope-medium text-gray-600">
                Land #{property.landNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text
            className="ml-1.5 text-sm font-manrope text-gray-600 flex-1"
            numberOfLines={1}
          >
            {property.location}
          </Text>
        </View>

        {/* Property Details */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-full">
            <Ionicons name="resize-outline" size={16} color="#4B5563" />
            <Text className="ml-1.5 text-sm font-manrope-medium text-gray-700">
              {property.dimension}
            </Text>
          </View>
          <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-full">
            <Ionicons name="compass-outline" size={16} color="#4B5563" />
            <Text className="ml-1.5 text-sm font-manrope-medium text-gray-700">
              {property.facing}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          className="bg-green-500 px-4 py-3 rounded-full flex-row items-center justify-center"
          onPress={() => router.push(`/plot/${property.id}`)}
        >
          <Text className="text-white font-manrope-bold text-sm mr-2">
            View Details
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
