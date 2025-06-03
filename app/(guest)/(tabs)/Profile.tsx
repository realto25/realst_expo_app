import { createOrUpdateUser, getUserProfile, updateUserProfile } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface UserProfile {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  role: "GUEST" | "CLIENT" | "MANAGER";
  createdAt: string;
  updatedAt: string;
  _count?: {
    visitRequests: number;
    ownedPlots: number;
  };
}

export default function ProfilePage() {
  const { signOut, userId, isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
  });

  // Fetch user profile from database
  const fetchProfile = async () => {
    if (!userId || !isSignedIn) return;

    try {
      setLoading(true);
      const profileData = await getUserProfile(userId);
      setProfile({
        id: profileData.id,
        clerkId: profileData.id,
        name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || "User",
        email: profileData.emailAddresses[0]?.emailAddress || "",
        phone: profileData.phoneNumbers[0]?.phoneNumber || "",
        role: profileData.publicMetadata.role || "GUEST",
        createdAt: new Date(profileData.createdAt).toISOString(),
        updatedAt: new Date(profileData.updatedAt).toISOString(),
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (user) {
        try {
          const newUser = {
            clerkId: userId,
            name: user.fullName || user.firstName || "User",
            email: user.primaryEmailAddress?.emailAddress || "",
            phone: user.primaryPhoneNumber?.phoneNumber || "",
            role: "GUEST" as const,
          };
          await createOrUpdateUser(newUser);
          const profileData = await getUserProfile(userId);
          setProfile({
            id: profileData.id,
            clerkId: profileData.id,
            name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || "User",
            email: profileData.emailAddresses[0]?.emailAddress || "",
            phone: profileData.phoneNumbers[0]?.phoneNumber || "",
            role: profileData.publicMetadata.role || "GUEST",
            createdAt: new Date(profileData.createdAt).toISOString(),
            updatedAt: new Date(profileData.updatedAt).toISOString(),
          });
        } catch (createError) {
          console.error("Error creating user:", createError);
          Alert.alert("Error", "Failed to create user profile");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    if (profile) {
      setEditData({
        name: profile.name,
        phone: profile.phone || "",
      });
      setEditModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId || !editData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      await updateUserProfile(userId, {
        name: editData.name.trim(),
        phone: editData.phone.trim() || undefined,
      });
      setEditModalVisible(false);
      await fetchProfile();
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, userId]);

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gray-50">
        <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">
          Not Signed In
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Please sign in to view your profile
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          className="bg-orange-500 px-8 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold text-lg">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#fb6e14" />
        <Text className="text-gray-600 mt-2">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View className="bg-orange-500 pt-12 pb-8 px-6">
        <View className="items-center">
          <Image
            source={{
              uri: user?.imageUrl || "https://via.placeholder.com/120",
            }}
            className="w-24 h-24 rounded-full border-4 border-white"
          />
          <Text className="text-white text-2xl font-bold mt-3">
            {profile?.name || user?.fullName || "User"}
          </Text>
          <Text className="text-orange-100 text-lg">
            {profile?.email || user?.primaryEmailAddress?.emailAddress}
          </Text>
          <View className="bg-white/20 px-3 py-1 rounded-full mt-2">
            <Text className="text-white text-sm font-medium">
              {profile?.role || "GUEST"}
            </Text>
          </View>
        </View>
      </View>

      {/* Profile Information */}
      <View className="bg-white mx-4 -mt-4 rounded-xl shadow-sm p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">
            Profile Information
          </Text>
          <TouchableOpacity
            onPress={handleEditProfile}
            className="bg-orange-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Edit</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Full Name</Text>
              <Text className="text-gray-800 text-base font-medium">
                {profile?.name || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Email</Text>
              <Text className="text-gray-800 text-base font-medium">
                {profile?.email || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Phone</Text>
              <Text className="text-gray-800 text-base font-medium">
                {profile?.phone || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3">
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Member Since</Text>
              <Text className="text-gray-800 text-base font-medium">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "Recently joined"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics */}
      {profile?._count && (
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Your Activity
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-orange-500">
                {profile._count.visitRequests}
              </Text>
              <Text className="text-gray-600 text-sm">Visit Requests</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-500">
                {profile._count.ownedPlots}
              </Text>
              <Text className="text-gray-600 text-sm">Owned Plots</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="mx-4 mt-4 space-y-3">
        <TouchableOpacity
          onPress={() => router.push("/Booking")}
          className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={24} color="#fb6e14" />
            <Text className="ml-3 text-gray-800 font-medium text-lg">
              My Bookings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text className="ml-3 text-red-600 font-medium text-lg">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text className="text-orange-500 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold">Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text className="text-orange-500 text-lg font-semibold">
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">
                Full Name *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
                value={editData.name}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter your full name"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Phone</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
                value={editData.phone}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, phone: text }))
                }
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <Text className="text-gray-500 text-sm text-center">
              Email cannot be changed here. Please update it in your account
              settings.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <View className="h-8" />
    </ScrollView>
  );
}
//few more error need to be fixed