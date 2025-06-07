import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";

const fadeIn = { from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } };

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50`} edges={["top", "bottom"]}>
        <Animatable.View animation={fadeIn} duration={300}>
          <Text style={tw`text-lg text-gray-600 font-medium`}>Loading...</Text>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "bottom"]}>
      <ScrollView style={tw`flex-1`}>
        <Animatable.View
          animation={fadeIn}
          duration={600}
          style={tw`bg-orange-600 pt-12 pb-6 px-6 shadow-lg rounded-b-2xl`}
        >
          <Animatable.View style={tw`items-center`} animation="zoomIn" duration={300}>
            <View
              style={tw`w-28 h-28 rounded-full bg-white border-4 border-orange-200 items-center justify-center mb-4 overflow-hidden`}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={tw`w-28 h-28 rounded-full`}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-outline" size={56} color="#f97316" />
              )}
            </View>
            <Animatable.Text
              animation={fadeIn}
              duration={800}
              style={tw`text-white text-3xl font-bold tracking-tight mb-1`}
            >
              {user?.firstName} {user?.lastName}
            </Animatable.Text>
            <Text style={tw`text-orange-100 text-base font-medium opacity-90`}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </Animatable.View>
        </Animatable.View>

        <View style={tw`px-5 py-6`}>
          <Animatable.View
            animation={fadeIn}
            duration={1000}
            style={tw`bg-white rounded-2xl p-5 shadow-sm mb-6 border border-orange-50`}
          >
            <Text style={tw`text-gray-500 text-sm font-semibold mb-4 uppercase tracking-wide`}>
              Account Information
            </Text>
            <View style={tw`space-y-4`}>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="mail-outline" size={22} color="#6b7280" />
                <Text style={tw`ml-4 text-gray-800 font-medium flex-1`}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="call-outline" size={22} color="#6b7280" />
                <Text style={tw`ml-4 text-gray-800 font-medium flex-1`}>
                  {user?.phoneNumbers?.[0]?.phoneNumber || "No phone number"}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="calendar-outline" size={22} color="#6b7280" />
                <Text style={tw`ml-4 text-gray-800 font-medium flex-1`}>
                  Joined {new Date(user?.createdAt || "").toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Animatable.View>

          <Animatable.View animation={fadeIn} duration={1200}>
            <TouchableOpacity
              style={tw`bg-orange-600 rounded-xl p-4 flex-row items-center justify-center shadow-md active:bg-orange-700`}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={tw`text-white font-semibold text-base ml-2`}>Sign Out</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
