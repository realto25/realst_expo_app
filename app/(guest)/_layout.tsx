import { Stack } from "expo-router";

export default function GuestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="project/[id]" />
      <Stack.Screen name="plot/[id]" />
    </Stack>
  );
}
