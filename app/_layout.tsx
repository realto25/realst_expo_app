import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
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
    <ClerkProvider tokenCache={tokenCache}>
      <MainRouter />
      <StatusBar style="auto" />
    </ClerkProvider>
  );
}

function MainRouter() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = user.publicMetadata?.role;

    switch (role) {
      case "GUEST":
        router.replace("/(guest)/(tabs)/Home");
        break;
      case "manager":
        router.replace("/(manager)/(tabs)/Home");
        break;
      default:
        router.replace("/(manager)/(tabs)/Home");
        break;
    }
  }, [isLoaded, user, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable stack header globally
        gestureEnabled: false, // Prevent gesture-based navigation from showing headers
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
