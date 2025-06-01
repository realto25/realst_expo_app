import { Stack } from "expo-router";

export default function ClientLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Client Home" }} />
      {/* Add other client screens here */}
    </Stack>
  );
}
