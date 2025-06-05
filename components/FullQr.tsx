import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { getOwnedLands } from "@/lib/api";

interface Land {
  id: string;
  number?: string;
  size?: string;
  status?: string;
  qrCode?: string;
  plot?: {
    id: string;
    title: string;
    location: string;
    imageUrls?: string[];
    project?: {
      id: string;
      name: string;
    };
  };
}

// Define custom animations
const fadeIn = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
};

export default function FullQr() {
  const { user } = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && id) {
      getOwnedLands(user.id)
        .then((lands) => {
          const foundLand = lands.find((l: Land) => l.id === id);
          if (foundLand) {
            setLand(foundLand);
          } else {
            setError("Land not found");
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load land data");
        })
        .finally(() => setLoading(false));
    }
  }, [user, id]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Animatable.View animation={fadeIn} duration={800}>
          <Ionicons name="qr-code-outline" size={48} color="#f97316" />
          <Text style={tw`text-gray-600 mt-3 text-base font-medium`}>
            Loading QR code...
          </Text>
        </Animatable.View>
      </View>
    );
  }

  if (error || !land || !land.qrCode) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Animatable.View animation={fadeIn} duration={1000}>
          <Text style={tw`text-red-500 text-lg font-medium text-center`}>
            {error || "No QR code available"}
          </Text>
          <TouchableOpacity
            style={tw`mt-6 bg-orange-600 px-6 py-3 rounded-xl shadow-sm active:bg-orange-700 transition-colors duration-200`}
            onPress={() => router.back()}
          >
            <Text style={tw`text-white font-semibold text-center`}>Go Back</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* Header with Back Button */}
      <View style={tw`bg-orange-600 pt-12 pb-6 px-5 shadow-lg flex-row items-center`}>
        <TouchableOpacity
          style={tw`p-2 rounded-full bg-orange-700/20 active:bg-orange-700/40`}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Animatable.Text
          animation={fadeIn}
          duration={1000}
          style={tw`text-white text-2xl font-bold ml-4 tracking-tight`}
        >
          Land QR Code
        </Animatable.Text>
      </View>

      {/* QR Code and Details */}
      <View style={tw`px-5 py-6`}>
        <Animatable.View
          animation={fadeIn}
          duration={1200}
          style={tw`bg-white rounded-2xl p-5 shadow-sm border border-orange-50 items-center`}
        >
          {/* QR Code */}
          <Image
            source={{ uri: land.qrCode }}
            style={tw`w-64 h-64 rounded-lg mb-6 bg-white p-2`}
            resizeMode="contain"
          />
          {/* Land Details */}
          <Text style={tw`text-xl font-bold text-gray-900 mb-2 tracking-tight`}>
            {land.plot?.title || "Unknown Plot"}
          </Text>
          <Text style={tw`text-gray-600 text-base font-medium mb-3 text-center`}>
            {land.plot?.location || "Unknown Location"}
          </Text>
          <View style={tw`flex-row items-center mb-3`}>
            <Text style={tw`text-gray-500 text-sm font-medium`}>
              {land.size || "N/A"} • Land No: {land.number || "N/A"}
            </Text>
          </View>
          {land.plot?.project && (
            <Text style={tw`text-sm text-gray-400 font-medium mb-4`}>
              Project: {land.plot.project.name}
            </Text>
          )}
        </Animatable.View>

        {/* Action Button */}
        <Animatable.View animation={fadeIn} duration={1400}>
          <TouchableOpacity
            style={tw`bg-orange-600 mt-6 px-6 py-4 rounded-xl shadow-sm active:bg-orange-700 transition-colors duration-200`}
            onPress={() => router.push(`/plot/${land.id}`)}
          >
            <Text style={tw`text-white font-semibold text-center text-base`}>
              View Plot Details
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </ScrollView>
  );
}