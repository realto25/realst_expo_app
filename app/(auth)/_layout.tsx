// app/(auth)/_layout.tsx
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";

type UserRole = "guest" | "client" | "manager";

// Updated API functions to use your correct endpoint
const API_BASE_URL = "https://main-admin-dashboard-orpin.vercel.app/api";

const getUserByClerkId = async (clerkId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users?clerkId=${clerkId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      console.log('User not found in backend');
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

const createOrUpdateUser = async (userData: {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

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
      
      // Get user from backend first
      let userData = await getUserByClerkId(clerkUser.id);
      
      if (userData) {
        // User exists in backend, get their current role
        const backendRole = (userData.role || 'guest').toLowerCase() as UserRole;
        console.log(`User found in backend with role: ${backendRole}`);
        
        // Update Clerk metadata to match backend role using the correct method
        const clerkRole = clerkUser.publicMetadata?.role as UserRole;
        if (clerkRole !== backendRole) {
          console.log(`Updating Clerk metadata from ${clerkRole} to ${backendRole}`);
          try {
            // Use the correct Clerk method for updating metadata
            await clerkUser.update({
              publicMetadata: { 
                ...clerkUser.publicMetadata,
                role: backendRole 
              },
            });
          } catch (clerkError) {
            console.error('Error updating Clerk metadata:', clerkError);
            // Continue with the role from backend even if Clerk update fails
          }
        }
        
        return backendRole;
      } else {
        // New user, create in backend with guest role
        console.log('Creating new user in backend with guest role');
        
        const newUserData = {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || 
                clerkUser.firstName || 
                clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                "User",
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          role: "guest" as UserRole
        };

        userData = await createOrUpdateUser(newUserData);

        // Set role in Clerk metadata for new users
        try {
          await clerkUser.update({
            publicMetadata: { 
              ...clerkUser.publicMetadata,
              role: "guest" 
            },
          });
          console.log('Set guest role in Clerk metadata for new user');
        } catch (clerkError) {
          console.error('Error setting Clerk metadata for new user:', clerkError);
        }

        console.log('New user created with guest role');
        return "guest" as UserRole;
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      
      // Return guest as fallback role
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
        
        // Small delay to ensure any async operations complete
        setTimeout(() => {
          handleRoleBasedRedirection(currentRole);
          setIsProcessing(false);
        }, 500);
        
      } catch (error) {
        console.error('Error in authentication handling:', error);
        // Fallback to guest page
        router.replace('/(guest)/(tabs)/Home');
        setIsProcessing(false);
      }
    };

    handleAuthentication();
  }, [isAuthLoaded, isSignedIn, isUserLoaded, user?.id]);

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
