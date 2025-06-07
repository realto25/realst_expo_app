// app/(auth)/_layout.tsx
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getUserByClerkId, createOrUpdateUser } from "@/lib/api";

type UserRole = "guest" | "client" | "manager";

export default function AuthLayout() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRoleBasedRedirection = (role: UserRole) => {
    console.log(`Redirecting user with role: ${role}`);
    
    switch(role) {
      case 'guest':
        router.replace('/(guest)/(tabs)/Home');
        break;
      case 'client':
        router.replace('/(client)/(tabs)/Home');
        break;
      case 'manager':
        router.replace('/(manager)/(tabs)/Home');
        break;
      default:
        console.log('Unknown role, defaulting to guest');
        router.replace('/(guest)/(tabs)/Home');
    }
  };

  const syncUserWithBackend = async (clerkUser: any) => {
    try {
      console.log('Syncing user with backend...');
      
      // Get user from backend
      let userData = await getUserByClerkId(clerkUser.id);
      
      if (userData) {
        // User exists in backend, get their current role
        const backendRole = userData.role as UserRole;
        console.log(`User found in backend with role: ${backendRole}`);
        
        // Update Clerk metadata to match backend role
        const clerkRole = clerkUser.publicMetadata?.role as UserRole;
        if (clerkRole !== backendRole) {
          console.log(`Updating Clerk metadata from ${clerkRole} to ${backendRole}`);
          await clerkUser.update({
            publicMetadata: { role: backendRole },
          });
        }
        
        return backendRole;
      } else {
        // New user, create in backend with guest role
        console.log('Creating new user in backend with guest role');
        
        userData = await createOrUpdateUser({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || 
                clerkUser.firstName || 
                clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                "User",
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          role: "guest"
        });

        // Update Clerk metadata
        await clerkUser.update({
          publicMetadata: { role: "guest" },
        });

        return "guest" as UserRole;
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      // Fallback to guest role if backend sync fails
      return "guest" as UserRole;
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      // Only proceed if everything is loaded and user is signed in
      if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user || isProcessing) {
        return;
      }

      setIsProcessing(true);

      try {
        console.log('User authenticated, processing...');
        
        // Sync user data with backend and get current role
        const currentRole = await syncUserWithBackend(user);
        
        // Redirect based on role
        handleRoleBasedRedirection(currentRole);
        
      } catch (error) {
        console.error('Error in authentication handling:', error);
        // Fallback to guest page
        router.replace('/(guest)/(tabs)/Home');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthentication();
  }, [isAuthLoaded, isSignedIn, isUserLoaded, user]);

  // Show loading state while processing
  if (!isAuthLoaded || !isUserLoaded || isProcessing) {
    return null; // You could return a loading component here
  }

  // If user is signed in, don't show auth screens (they should be redirected)
  if (isSignedIn) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      {/* Removed sign-up since we only use Google OAuth */}
    </Stack>
  );
}
