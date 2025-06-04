// File: app/(client)/OwnedLandsScreen.tsx
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import OwnedPlotCard from "@/components/OwnedPlotCard";
import { getOwnedLands } from "@/lib/api";

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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" />
        <Text className="text-gray-600 mt-2">Loading your plots...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-4">My Properties</Text>
      {lands.map((land) => (
        <OwnedPlotCard key={land.id} land={land} />
      ))}
    </ScrollView>
  );
}
