import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Props for the PhotoPicker component.
 */
interface PhotoPickerProps {
  /** Callback function called when photos are selected (returns array of file URIs) */
  onPhotosSelected: (uris: string[]) => void;
}

/**
 * Component for selecting photos from gallery or taking photos with camera.
 */
export function PhotoPicker({ onPhotosSelected }: PhotoPickerProps) {
  /**
   * Requests media library permissions.
   */
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to select photos!'
      );
      return false;
    }
    return true;
  };

  /**
   * Requests camera permissions.
   */
  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos!'
      );
      return false;
    }
    return true;
  };

  /**
   * Handles picking photos from gallery.
   */
  const handlePickPhotos = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets) {
        // Extract URIs from selected assets
        const uris = result.assets.map((asset) => asset.uri);

        // Validate max 100 photos
        if (uris.length > 100) {
          Alert.alert('Too Many Photos', 'Maximum 100 files allowed. Please select fewer files.');
          return;
        }

        if (uris.length === 0) {
          Alert.alert('No Photos Selected', 'Please select at least one photo.');
          return;
        }

        // Call onPhotosSelected with URIs
        onPhotosSelected(uris);
      }
    } catch (error) {
      console.error('[PhotoPicker] Error picking photos:', error);
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    }
  };

  /**
   * Handles taking a photo with camera.
   */
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Get photo URI from result
        const uri = result.assets[0].uri;
        // Call onPhotosSelected with single URI
        onPhotosSelected([uri]);
      }
    } catch (error) {
      console.error('[PhotoPicker] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handlePickPhotos}>
        <Text style={styles.buttonText}>Select from Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cameraButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

