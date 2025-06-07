import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    manrope: require("../assets/fonts/Manrope-Regular.ttf"),
    "manrope-medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "manrope-bold": require("../assets/fonts/Manrope-Bold.ttf"),
    Space: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ClerkProvider 
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <MainRouter />
      <StatusBar style="auto" />
    </ClerkProvider>
  );
}

function MainRouter() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Let individual screens handle their own navigation logic
  // Remove automatic redirection from root layout to prevent conflicts
  // The index.tsx and AuthLayout will handle proper redirection

  useEffect(() => {
    // Only log the current state for debugging
    if (isLoaded && isUserLoaded) {
      console.log('Auth State:', {
        isSignedIn,
        userId: user?.id,
        role: user?.publicMetadata?.role
      });
    }
  }, [isLoaded, isUserLoaded, isSignedIn, user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable stack header globally
        gestureEnabled: false, // Prevent gesture-based navigation from showing headers
        animation: 'none', // Disable animations to prevent navigation flicker
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(guest)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(manager)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}
