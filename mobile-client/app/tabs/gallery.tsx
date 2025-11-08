import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function GalleryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gallery</Text>
      <Text style={styles.subtitle}>Gallery screen will be implemented in PR #20</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
