import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { Photo } from '../types/photo';
import { UPLOAD_STATUS } from '../types/photo';

/**
 * Props for the PhotoGrid component.
 */
interface PhotoGridProps {
  /** Array of photos to display */
  photos: Photo[];
  /** Callback function called when a photo is pressed */
  onPhotoPress: (photo: Photo) => void;
  /** Callback function called when a photo should be deleted */
  onDeletePhoto?: (photoId: string) => void;
  /** Whether there are more pages to load */
  hasMorePages?: boolean;
  /** Footer component to render at the bottom of the list */
  footerComponent?: React.ReactElement | null;
}

/**
 * Formats upload date to a readable string.
 */
function formatUploadDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Helper function to get the status badge color based on status.
 */
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return '#10b981';
    case UPLOAD_STATUS.FAILED:
      return '#ef4444';
    case UPLOAD_STATUS.UPLOADING:
      return '#3b82f6';
    case UPLOAD_STATUS.PENDING:
      return '#9ca3af';
    default:
      return '#9ca3af';
  }
}

/**
 * Renders a single photo item in the grid.
 */
function renderPhotoItem({ 
  item: photo, 
  onPress, 
  onDelete 
}: { 
  item: Photo; 
  onPress: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
}) {
  const showImage = photo.downloadUrl && photo.status === UPLOAD_STATUS.COMPLETED;
  const statusBadgeColor = getStatusBadgeColor(photo.status);
  const truncatedFileName =
    photo.fileName.length > 20 ? `${photo.fileName.substring(0, 20)}...` : photo.fileName;

  const handleLongPress = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Photo',
        'Do you want to delete this photo?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(photo.photoId),
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => onPress(photo)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        {showImage ? (
          <Image
            source={{ uri: photo.downloadUrl || '' }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
          </View>
        )}
      </View>

      {/* Metadata section */}
      <View style={styles.metadataContainer}>
        {/* File name */}
        <Text style={styles.fileName} numberOfLines={1}>
          {truncatedFileName}
        </Text>

        {/* Upload date */}
        <Text style={styles.uploadDate}>
          {formatUploadDate(photo.uploadedAt || photo.createdAt)}
        </Text>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
          <Text style={styles.statusText}>{photo.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Component for displaying photos in a grid layout.
 */
export function PhotoGrid({ photos, onPhotoPress, onDeletePhoto, footerComponent }: PhotoGridProps) {
  return (
    <FlatList
      data={photos}
      renderItem={({ item }) => renderPhotoItem({ item, onPress: onPhotoPress, onDelete: onDeletePhoto })}
      keyExtractor={(item) => item.photoId}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={footerComponent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  metadataContainer: {
    padding: 12,
    gap: 6,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  uploadDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
});

