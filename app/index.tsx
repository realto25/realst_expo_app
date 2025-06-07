import { getUserByClerkId } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type UserRole = "guest" | "client" | "manager";

const Home = () => {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineUserRole = async () => {
      // Wait for auth to be loaded
      if (!isAuthLoaded || !isUserLoaded) {
        return;
      }

      // If not signed in, redirect to welcome/sign-in
      if (!isSignedIn || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get user role from backend
        const userData = await getUserByClerkId(user.id);
        
        if (userData && userData.role) {
          setUserRole(userData.role as UserRole);
        } else {
          // Fallback to Clerk metadata or default to guest
          const clerkRole = user.publicMetadata?.role as UserRole;
          setUserRole(clerkRole || "guest");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Fallback to Clerk metadata or default to guest
        const clerkRole = user.publicMetadata?.role as UserRole;
        setUserRole(clerkRole || "guest");
      } finally {
        setIsLoading(false);
      }
    };

    determineUserRole();
  }, [isSignedIn, isAuthLoaded, isUserLoaded, user]);

  // Show loading while determining auth state and user role
  if (!isAuthLoaded || !isUserLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect based on user role
  switch (userRole) {
    case "guest":
      return <Redirect href="/(guest)/(tabs)/Home" />;
    case "client":
      return <Redirect href="/(client)/(tabs)/Home" />;
    case "manager":
      return <Redirect href="/(manager)/(tabs)/Home" />;
    default:
      // Fallback to guest if role is unknown
      return <Redirect href="/(guest)/(tabs)/Home" />;
  }
};

export default Home;
