import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import OwnedPlotCard from "@/components/OwnedPlotCard";
import { getOwnedLands } from "@/lib/api";

// Define custom animations
const fadeIn = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
};

export default function OwnedLandsScreen() {
  const { user } = useUser();
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getOwnedLands(user.id)
        .then(setLands)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Animatable.View animation={fadeIn} duration={800}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={tw`text-gray-600 mt-3 text-base font-medium`}>
            Loading your plots...
          </Text>
        </Animatable.View>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-gray-50 px-5 pt-6`}>
      <Animatable.Text
        animation={fadeIn}
        duration={1000}
        style={tw`text-3xl font-bold text-orange-600 mb-5 tracking-tight`}
      >
        My Properties
      </Animatable.Text>
      {lands.length > 0 ? (
        <View style={tw`space-y-4`}>
          {lands.map((land, index) => (
            <Animatable.View
              key={land.id}
              animation={fadeIn}
              duration={1200 + index * 100}
              style={tw`w-full`}
            >
              <OwnedPlotCard land={land} />
            </Animatable.View>
          ))}
        </View>
      ) : (
        <Animatable.View
          animation={fadeIn}
          duration={1200}
          style={tw`items-center justify-center py-10`}
        >
          <Text style={tw`text-gray-500 text-lg font-medium text-center`}>
            No properties found.
          </Text>
        </Animatable.View>
      )}
    </ScrollView>
  );
}
