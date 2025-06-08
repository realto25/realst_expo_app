import { useSignIn, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, // Import for loading spinner
  Image,
  ScrollView,
  Text,
  View,
  StyleSheet, // For better styling organization
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient"; // For a gradient background
import Toast from "react-native-toast-message"; // For toast notifications

import OAuth from "@/components/OAuth"; // Assuming this is your Google sign-in button
import { createOrUpdateUser, getUserByClerkId } from "@/lib/api";

type UserRole = "guest" | "client" | "manager";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false); // New loading state

  // Helper function for role-based redirection
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
        // Fallback or specific error handling if role is unexpected
        Toast.show({
          type: 'error',
          text1: 'Invalid User Role',
          text2: 'Could not determine your role. Defaulting to guest.',
        });
        router.replace("/(guest)/(tabs)/Home");
    }
  };

  // Function to handle user data after successful sign-in
  const handleUserDataAfterSignIn = async (signedInUser: any) => {
    setLoading(true); // Start loading
    try {
      // Get user data from backend
      let userData = await getUserByClerkId(signedInUser.id);
      let roleToRedirect: UserRole = "guest"; // Default to guest

      if (userData) {
        // User exists, use their role from backend
        roleToRedirect = userData.role as UserRole;
        // Update Clerk metadata with backend role
        await signedInUser.update({
          publicMetadata: { role: roleToRedirect },
        });
      } else {
        // New user, create with default guest role
        userData = await createOrUpdateUser({
          clerkId: signedInUser.id,
          email: signedInUser.primaryEmailAddress?.emailAddress || "",
          name:
            signedInUser.fullName ||
            signedInUser.firstName ||
            signedInUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "User",
          phone: signedInUser.primaryPhoneNumber?.phoneNumber,
          role: "guest", // Default role for new users
        });
        roleToRedirect = "guest"; // Confirm guest role for redirection
        // Update Clerk metadata
        await signedInUser.update({
          publicMetadata: { role: "guest" },
        });
      }

      // Redirect immediately after processing user data and updating metadata
      handleRoleBasedRedirection(roleToRedirect);

    } catch (error: any) {
      console.error("Error handling user data:", error);
      Toast.show({
        type: 'error',
        text1: 'Sign-in Failed',
        text2: error.message || 'Failed to process user data. Please try again.',
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // useEffect to handle existing sessions or metadata updates
  useEffect(() => {
    if (isLoaded && user) {
      // Check if the user object has publicMetadata and a role defined
      const userRole = user.publicMetadata?.role as UserRole;
      if (userRole) {
        // If role is already present (e.g., returning user, or just updated)
        handleRoleBasedRedirection(userRole);
      }
      // If user is loaded but role isn't in metadata yet, it means
      // handleUserDataAfterSignIn hasn't completed or is a new session
      // where metadata isn't immediately available from Clerk.
      // We don't want to redirect to "notfound", so we wait for handleOAuthSuccess
      // to explicitly call handleUserDataAfterSignIn.
    }
  }, [user, isLoaded]); // Depend on user and isLoaded

  // Handle successful OAuth sign in
  const handleOAuthSuccess = async () => {
    try {
      if (user) {
        // Ensure Clerk's user object is fully populated before calling backend logic
        await handleUserDataAfterSignIn(user);
      } else {
        // This case should ideally not happen if OAuth just succeeded,
        // but good to have a fallback or log for debugging.
        console.warn("OAuth success but user object is null.");
        Toast.show({
          type: 'error',
          text1: 'Sign-in Issue',
          text2: 'User data not found after successful authentication. Please try again.',
        });
      }
    } catch (error) {
      console.error("OAuth success handling error:", error);
      // Errors are already handled in handleUserDataAfterSignIn
    }
  };

  if (!isLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <LinearGradient
          colors={['#4A90E2', '#3478F6']} // A nice blue gradient
          style={styles.headerGradient}
        >
          <Image
            source={require('../../assets/Icon/android/playstore-icon.png')} // Replace with your actual logo path
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerText}>Sign In to Your Account</Text>
        </LinearGradient>

        <View style={styles.contentArea}>
          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>Sign in with Google to continue</Text>
          </View>

          {/* Google OAuth Component */}
          <OAuth onSuccess={handleOAuthSuccess} />

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              New users will be created with Guest access.{"\n"}
              Your role can be updated by an administrator.
            </Text>
          </View>
        </View>
      </View>
      {/* Toast message component */}
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8', // Light background for the scroll view
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Manrope-Regular', // Assuming you have Manrope fonts loaded
    color: '#333',
  },
  headerGradient: {
    width: '100%',
    height: 250,
    justifyContent: 'flex-end', // Align content to the bottom
    alignItems: 'center',
    paddingBottom: 40, // Space from bottom
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 26,
    color: '#fff',
    fontFamily: 'Manrope-Bold', // Use a bold font
    textAlign: 'center',
    marginTop: 10,
  },
  contentArea: {
    paddingHorizontal: 25,
    marginTop: 20, // Space from the header
  },
  welcomeSection: {
    marginBottom: 30,
    marginTop: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 40,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
    lineHeight: 20, // Improve readability
  },
});

export default SignIn;
