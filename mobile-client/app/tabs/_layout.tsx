import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigation is handled automatically by RootLayoutNav
  };

  return (
    <Tabs
      initialRouteName="gallery"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: () => <Text>📤</Text>,
          headerTitle: user ? `${user.username}'s Upload` : 'Upload',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: () => <Text>🖼️</Text>,
          headerTitle: user ? `${user.username}'s Gallery` : 'Gallery',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
