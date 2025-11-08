import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: () => <Text>📤</Text>,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: () => <Text>🖼️</Text>,
        }}
      />
    </Tabs>
  );
}
