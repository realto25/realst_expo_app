import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

export default function ClientLayout() {
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "left", "right"]}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#f97316" },
          headerTintColor: "white",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Client Home" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="plot/[id]" options={{ title: "Plot Details" }} />
        <Stack.Screen name="qr-code/[id]" options={{ title: "QR Code" }} />
        <Stack.Screen name="camera/[id]" options={{ title: "Camera Feed" }} />
      </Stack>
    </SafeAreaView>
  );
}
