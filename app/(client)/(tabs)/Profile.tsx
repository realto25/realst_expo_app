import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const Profile = () => {
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
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Profile Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-4">
        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-4">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={48} color="#2563eb" />
            )}
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-blue-100">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>

      {/* Profile Details */}
      <View className="px-4 py-6">
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-2">
            Account Information
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
              <Text className="ml-3 text-gray-700">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text className="ml-3 text-gray-700">
                {user?.phoneNumbers?.[0]?.phoneNumber ||
                  "No phone number added"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text className="ml-3 text-gray-700">
                Joined {new Date(user?.createdAt || "").toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center mt-4"
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;
