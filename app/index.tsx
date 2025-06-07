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
      
      // First, set guest role immediately if user has no role
      if (!clerkUser.publicMetadata?.role) {
        console.log('Setting initial guest role in Clerk metadata');
        await clerkUser.update({
          publicMetadata: { role: "guest" },
        });
      }
      
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

        console.log('New user created with guest role');
        return "guest" as UserRole;
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      
      // Ensure guest role is set even if backend fails
      try {
        await clerkUser.update({
          publicMetadata: { role: "guest" },
        });
        console.log('Set fallback guest role in Clerk metadata');
      } catch (updateError) {
        console.error("Error setting fallback role:", updateError);
      }
      
      return "guest" as UserRole;
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      // Only proceed if everything is loaded and user is signed in
      if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user) {
        return;
      }

      // Prevent duplicate processing
      if (isProcessing) {
        console.log('Already processing authentication, skipping...');
        return;
      }

      setIsProcessing(true);

      try {
        console.log('User authenticated, processing...');
        
        // Sync user data with backend and get current role
        const currentRole = await syncUserWithBackend(user);
        
        console.log(`Final role determined: ${currentRole}`);
        
        // Small delay to ensure Clerk metadata is updated
        setTimeout(() => {
          handleRoleBasedRedirection(currentRole);
        }, 500);
        
      } catch (error) {
        console.error('Error in authentication handling:', error);
        // Fallback to guest page
        router.replace('/(guest)/(tabs)/Home');
      } finally {
        // Reset processing state after a delay
        setTimeout(() => {
          setIsProcessing(false);
        }, 1000);
      }
    };

    handleAuthentication();
  }, [isAuthLoaded, isSignedIn, isUserLoaded, user?.id]); // Added user?.id to dependencies

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
