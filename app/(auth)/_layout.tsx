// app/(auth)/_layout.tsx
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, Stack } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  useEffect(() => {
    if (isAuthLoaded && isUserLoaded && isSignedIn && user) {
      // Get role from Clerk metadata
      const role = user.publicMetadata.role as string || 'guest';
      console.log(`User signed in. Role: ${role}`);

      // Redirect based on role
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
          router.replace('/(guest)/(tabs)/Home');
      }
    }
  }, [isAuthLoaded, isSignedIn, isUserLoaded, user]);

  if (!isAuthLoaded || !isUserLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}