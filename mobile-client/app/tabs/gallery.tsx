import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PhotoGrid } from '../../components/PhotoGrid';
import { usePhotoGallery } from '../../hooks/usePhotoGallery';
import type { Photo } from '../../types/photo';
import { UPLOAD_STATUS } from '../../types/photo';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 * Should match the userId used in UploadScreen.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Gallery screen component that displays user's photos in a grid layout with pagination.
 */
export default function GalleryScreen() {
  // Initialize photo gallery hook
  const { photos, loading, error, currentPage, totalPages, loadMore, refetch } =
    usePhotoGallery(MOCK_USER_ID);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle photo press - open photo in full screen
  const handlePhotoPress = (photo: Photo) => {
    if (photo.downloadUrl && photo.status === UPLOAD_STATUS.COMPLETED) {
      // Open photo URL in browser or image viewer
      Linking.openURL(photo.downloadUrl).catch((err) => {
        console.error('[GalleryScreen] Error opening photo:', err);
        Alert.alert('Error', 'Failed to open photo. Please try again.');
      });
    } else {
      Alert.alert('Photo Not Available', 'This photo is not yet available for viewing.');
    }
  };

  // Check if more pages exist
  const hasMorePages = currentPage < totalPages - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        {/* Screen header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Photos</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={[styles.refreshButtonText, loading && styles.refreshButtonTextDisabled]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading spinner - show when loading and no photos */}
        {loading && photos.length === 0 && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && photos.length === 0 && !error && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyText}>
              Upload your first photo to get started. Your photos will appear here once uploaded.
            </Text>
          </View>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <PhotoGrid
            photos={photos}
            onPhotoPress={handlePhotoPress}
            footerComponent={
              <>
                {/* Load More button */}
                {hasMorePages && (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity
                      style={[styles.loadMoreButton, loading && styles.loadMoreButtonDisabled]}
                      onPress={loadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" style={styles.loadMoreSpinner} />
                          <Text style={styles.loadMoreButtonText}>Loading...</Text>
                        </>
                      ) : (
                        <Text style={styles.loadMoreButtonText}>Load More</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* End of results message */}
                {!hasMorePages && (
                  <View style={styles.endContainer}>
                    <Text style={styles.endText}>You've reached the end of your photos.</Text>
                  </View>
                )}
              </>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  refreshButtonTextDisabled: {
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 300,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadMoreButtonDisabled: {
    opacity: 0.5,
  },
  loadMoreSpinner: {
    marginRight: 4,
  },
  loadMoreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  endText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
