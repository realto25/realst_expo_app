import { Link } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";

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

// Define custom animations
const fadeIn = {
  from: { opacity: 0, translateY: 10 },
  to: { opacity: 1, translateY: 0 },
};

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
      <Animatable.View
        animation={fadeIn}
        duration={1000}
        style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-orange-50`}
      >
        <Text style={tw`text-red-500 text-base font-medium text-center`}>
          Invalid plot data
        </Text>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View
      animation={fadeIn}
      duration={1000}
      style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-orange-50`}
    >
      {/* Image */}
      {plot.imageUrls?.[0] && (
        <Image
          source={{ uri: plot.imageUrls[0] }}
          style={tw`h-40 w-full rounded-xl mb-4`}
          resizeMode="cover"
        />
      )}

      {/* Title and Location */}
      <Text style={tw`text-xl font-bold text-gray-900 mb-1 tracking-tight`}>
        {plot.title}
      </Text>
      <Text style={tw`text-gray-600 text-base font-medium mb-3`}>
        {plot.location}
      </Text>

      {/* Specs */}
      <View style={tw`flex-row items-center mb-3`}>
        <Text style={tw`text-gray-500 text-sm font-medium`}>
          {land.size || "N/A"} • Land No: {land.number || "N/A"}
        </Text>
      </View>

      {/* Project */}
      {project && (
        <Text style={tw`text-sm text-gray-400 font-medium mb-4`}>
          Project: {project.name}
        </Text>
      )}

      {/* QR Code Section */}
      {land.qrCode && (
        <View style={tw`mt-4 mb-4 items-center`}>
          <Text style={tw`text-gray-600 mb-2 font-semibold text-sm uppercase tracking-wide`}>
            Land QR Code
          </Text>
          <Image
            source={getQrCodeImageSource(land.qrCode)}
            style={tw`w-36 h-36 rounded-lg`}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Footer Actions */}
      <View style={tw`flex-row justify-between items-center mt-4 gap-3`}>
        {land.qrCode && (
          <Link href={`/qr-code/${land.id}`} asChild>
            <TouchableOpacity
              style={tw`bg-orange-600 flex-1 px-4 py-3 rounded-xl shadow-sm active:bg-orange-700 transition-colors duration-200`}
            >
              <Text style={tw`text-white font-semibold text-center`}>View Full QR</Text>
            </TouchableOpacity>
          </Link>
        )}
        <Link href={`/plot/${land.id}`} asChild>
          <TouchableOpacity
            style={tw`bg-orange-600 flex-1 px-4 py-3 rounded-xl shadow-sm active:bg-orange-700 transition-colors duration-200`}
          >
            <Text style={tw`text-white font-semibold text-center`}>View Details</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </Animatable.View>
  );
}