// File: app/(client)/OwnedPlotCard.tsx
import { Link } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface OwnedPlotCardProps {
  land: Land;
}

export default function OwnedPlotCard({ land }: OwnedPlotCardProps) {
  const plot = land.plot;
  const project = plot?.project;

  // Extract the base64 data from the QR code string
  const getQrCodeImageSource = (qrCodeString: string): ImageSourcePropType => {
    if (!qrCodeString) return { uri: "" };
    // The string is already in the correct format: data:image/png;base64,...
    return { uri: qrCodeString };
  };

  if (!plot) {
    return (
      <View className="bg-white rounded-2xl shadow p-4 mb-4">
        <Text className="text-red-500">Invalid plot data</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl shadow p-4 mb-4">
      {/* Image */}
      {plot.imageUrls?.[0] && (
        <Image
          source={{ uri: plot.imageUrls[0] }}
          className="h-36 w-full rounded-xl mb-4"
        />
      )}

      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-1">{plot.title}</Text>
      <Text className="text-gray-600 mb-2">{plot.location}</Text>

      {/* Specs */}
      <Text className="text-gray-500 mb-1">
        {land.size || "N/A"} • Land No: {land.number || "N/A"}
      </Text>

      {/* Project */}
      {project && (
        <Text className="text-sm text-gray-400">Project: {project.name}</Text>
      )}

      {/* QR Code Section */}
      {land.qrCode && (
        <View className="mt-4 mb-4 items-center">
          <Text className="text-gray-600 mb-2 font-medium">Land QR Code</Text>
          <Image
            source={getQrCodeImageSource(land.qrCode)}
            className="w-32 h-32 rounded-lg"
            resizeMode="contain"
          />
        </View>
      )}

      {/* Footer Actions */}
      <View className="flex-row justify-between items-center mt-4">
        {land.qrCode && (
          <Link href={`/qr-code/${land.id}`} asChild>
            <TouchableOpacity className="bg-red-500 px-4 py-2 rounded-xl">
              <Text className="text-white font-semibold">View Full QR</Text>
            </TouchableOpacity>
          </Link>
        )}

        <Link href={`/plot/${land.id}`} asChild>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-xl">
            <Text className="text-white font-semibold">View Details</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
