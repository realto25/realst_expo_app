import { Tabs } from "expo-router";

export default function ClientTabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="Home"
        options={{
          title: "Client Home",
          // Add tab bar options here (icons, etc.)
        }}
      />
      {/* Add other client tab screens here */}
    </Tabs>
  );
}
