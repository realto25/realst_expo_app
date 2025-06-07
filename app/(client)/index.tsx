import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { getAllPlots } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const fadeIn = { from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } };

export default function ClientHomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPlots()
      .then(setPlots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={tw`pb-6`}>
        <Animatable.View
          animation={fadeIn}
          duration={1000}
          style={tw`bg-orange-600 pt-12 pb-6 px-5 shadow-lg`}
        >
          <Text style={tw`text-white text-2xl font-bold tracking-tight`}>
            Welcome, {user?.firstName || "Guest"}
          </Text>
        </Animatable.View>
        <View style={tw`px-5 py-6`}>
          <Animatable.Text
            animation={fadeIn}
            duration={1200}
            style={tw`text-xl font-bold text-gray-900 mb-4 tracking-tight`}
          >
            Featured Plots
          </Animatable.Text>
          {loading ? (
            <ActivityIndicator size="large" color="#f97316" />
          ) : (
            plots.slice(0, 3).map((plot, index) => (
              <Animatable.View
                key={plot.id}
                animation={fadeIn}
                duration={1400 + index * 200}
                style={tw`mb-4`}
              >
                <TouchableOpacity
                  style={tw`bg-white rounded-xl p-4 shadow-sm border border-orange-50`}
                  onPress={() => router.push(`/plot/${plot.id}`)}
                >
                  <Text style={tw`text-lg font-semibold text-gray-800`}>{plot.title}</Text>
                  <Text style={tw`text-gray-600`}>{plot.location}</Text>
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
          <Animatable.View animation={fadeIn} duration={1800}>
            <TouchableOpacity
              style={tw`bg-orange-600 rounded-xl p-4 mt-4 flex-row items-center justify-center shadow-md active:bg-orange-700`}
              onPress={() => router.push("/(client)/(tabs)/Home")}
            >
              <Ionicons name="search-outline" size={22} color="white" />
              <Text style={tw`text-white font-semibold text-base ml-3`}>Explore More</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
