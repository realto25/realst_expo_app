import { Tabs } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs 
    screenOptions={{
      headerShown:false
    }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home-outline" color={color} />,
        }}
      />
       <Tabs.Screen
        name="Attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="add-circle-outline" color={color} />,
        }}
      />
       <Tabs.Screen
        name="Camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="camera-outline" color={color} />,
        }}
      />
    
      
    
    </Tabs>
  );
}
