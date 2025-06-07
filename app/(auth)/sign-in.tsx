import { useSignIn, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";

import OAuth from "@/components/OAuth";
import { createOrUpdateUser, getUserByClerkId } from "@/lib/api";
import { StatusBar } from "expo-status-bar";

type UserRole = "guest" | "client" | "manager";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();
  const router = useRouter();

  // Handle redirection based on user role
  const handleRoleBasedRedirection = (role: UserRole) => {
    switch (role) {
      case "guest":
        router.replace("/(guest)/(tabs)/Home");
        break;
      case "client":
        router.replace("/(client)/(tabs)/Home");
        break;
      case "manager":
        router.replace("/(manager)/(tabs)/Home");
        break;
      default:
        router.replace("/(guest)/(tabs)/Home");
    }
  };

  const handleUserDataAfterSignIn = async (signedInUser: any) => {
    try {
      // Get user data from backend
      let userData = await getUserByClerkId(signedInUser.id);
      
      if (userData) {
        // User exists, check their current role from backend
        const currentRole = userData.role as UserRole;
        
        // Update Clerk metadata with backend role
        await signedInUser.update({
          publicMetadata: { role: currentRole },
        });
        
        // Redirect based on current role from backend
        handleRoleBasedRedirection(currentRole);
      } else {
        // New user, create with default guest role
        userData = await createOrUpdateUser({
          clerkId: signedInUser.id,
          email: signedInUser.primaryEmailAddress?.emailAddress || "",
          name: signedInUser.fullName || 
                signedInUser.firstName || 
                signedInUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                "User",
          phone: signedInUser.primaryPhoneNumber?.phoneNumber,
          role: "guest" // Default role for new users
        });

        // Update Clerk metadata
        await signedInUser.update({
          publicMetadata: { role: "guest" },
        });

        // Redirect to guest page for new users
        handleRoleBasedRedirection("guest");
      }

      return userData;
    } catch (error) {
      console.error("Error handling user data:", error);
      Alert.alert("Error", "Failed to process user data. Please try again.");
      throw error;
    }
  };

  // Check if user is already signed in and redirect accordingly
  useEffect(() => {
    if (user && isLoaded) {
      const userRole = user.publicMetadata?.role as UserRole;
      if (userRole) {
        handleRoleBasedRedirection(userRole);
      }
    }
  }, [user, isLoaded]);

  // Handle successful OAuth sign in
  const handleOAuthSuccess = async () => {
    try {
      if (user) {
        await handleUserDataAfterSignIn(user);
      }
    } catch (error) {
      console.error("OAuth success handling error:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/5c/ee/6e/5cee6e582b2ac0529b43c3e1996703fd.jpg",
            }}
            className="z-0 w-full h-[150px] rounded-b-2xl"
          />
          <Text className="text-2xl text-gray-900 text-center font-manrope absolute bottom-12 left-20">
            Sign In to Your Account
          </Text>
        </View>

        <View className="px-5">
          {/* Welcome Message */}
          <View className="mb-8 mt-6">
            <Text className="text-lg font-manrope-bold text-center mb-2">
              Welcome Back!
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Sign in with Google to continue
            </Text>
          </View>

          {/* Google OAuth Component */}
          <OAuth onSuccess={handleOAuthSuccess} />

          {/* Info Text */}
          <View className="mt-8">
            <Text className="text-sm text-gray-500 text-center">
              New users will be created with Guest access.{"\n"}
              Your role can be updated by an administrator.
            </Text>
          </View>
        </View>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default SignIn;
