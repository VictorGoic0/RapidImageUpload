import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PhotoPicker } from '../../components/PhotoPicker';
import { UploadProgress } from '../../components/UploadProgress';
import { BatchProgress } from '../../components/BatchProgress';
import { useWebSocket } from '../../hooks/useWebSocket';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { useThrottledProgress } from '../../hooks/useThrottledProgress';
import type { UploadStatus, PhotoProgress } from '../../types/photo';
import { UPLOAD_STATUS } from '../../types/photo';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 * Should match the userId used in GalleryScreen.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Upload screen component that handles photo uploads with progress tracking.
 */
export default function UploadScreen() {
  // Initialize WebSocket hook
  const { connected, progress: websocketProgress, sendProgress } = useWebSocket(MOCK_USER_ID);

  // Initialize throttled progress callback
  const throttledProgress = useThrottledProgress(sendProgress);

  // Create progress callback for usePhotoUpload
  const handleProgressUpdate = useCallback(
    (photoId: string, progressPercent: number, fileName: string, status: UploadStatus) => {
      throttledProgress(photoId, progressPercent, {
        fileName,
        status,
        message: status === UPLOAD_STATUS.COMPLETED ? 'Upload completed' : 'Uploading...',
        timestamp: new Date().toISOString(),
      });
    },
    [throttledProgress]
  );

  // Initialize photo upload hook
  const { uploading, error, uploadResults, uploadPhotos, cleanup } = usePhotoUpload(
    MOCK_USER_ID,
    handleProgressUpdate
  );

  // State for selected URIs
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  // Handle photos selected from PhotoPicker
  const handlePhotosSelected = useCallback(
    (uris: string[]) => {
      setSelectedUris(uris);
      setShowProgress(true);
      uploadPhotos(uris);
    },
    [uploadPhotos]
  );

  // Handle reset to clear state and start over
  const handleReset = useCallback(() => {
    setSelectedUris([]);
    setShowProgress(false);
    cleanup();
  }, [cleanup]);

  // Merge local upload progress with WebSocket progress updates
  const mergedProgress = useMemo(() => {
    const merged = new Map<string, { fileName: string; progress: number; status: UploadStatus }>();
    
    // Start with local upload results
    uploadResults.forEach((result, fileName) => {
      merged.set(fileName, {
        fileName,
        progress: result.progress,
        status: result.status,
      });
    });

    // Override with WebSocket updates if available (more up-to-date)
    websocketProgress.forEach((wsUpdate, photoId) => {
      // Find the file name for this photoId from uploadResults
      uploadResults.forEach((result, fileName) => {
        if (result.photoId === photoId) {
          merged.set(fileName, {
            fileName,
            progress: wsUpdate.progressPercentage,
            status: wsUpdate.status,
          });
        }
      });
    });

    return merged;
  }, [uploadResults, websocketProgress]);

  // Check if all uploads are complete
  const allComplete = selectedUris.length > 0 && 
    Array.from(mergedProgress.values()).every(
      (info) => info.status === UPLOAD_STATUS.COMPLETED || info.status === UPLOAD_STATUS.FAILED
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Screen title */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Photos</Text>
          
          {/* WebSocket connection status indicator */}
          <View style={styles.connectionIndicator}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connected ? '#10b981' : '#ef4444' },
              ]}
            />
            <Text style={styles.connectionText}>
              {connected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Upload Zone - show when not uploading or when uploads are complete */}
        {(!uploading || allComplete) && (
          <View style={styles.uploadSection}>
            <PhotoPicker onPhotosSelected={handlePhotosSelected} />
          </View>
        )}

        {/* Progress section */}
        {showProgress && (
          <View style={styles.progressSection}>
            {/* Batch progress summary */}
            <BatchProgress uploads={mergedProgress} />

            {/* Individual file progress indicators */}
            <View style={styles.fileProgressSection}>
              <Text style={styles.sectionTitle}>File Progress</Text>
              {selectedUris.map((uri, index) => {
                // Extract filename from URI or use index
                const fileName = uri.split('/').pop() || `photo_${index + 1}`;
                const progressInfo = mergedProgress.get(fileName) || {
                  fileName,
                  progress: 0,
                  status: UPLOAD_STATUS.PENDING as UploadStatus,
                };
                return (
                  <UploadProgress
                    key={uri}
                    fileName={progressInfo.fileName}
                    progress={progressInfo.progress}
                    status={progressInfo.status}
                  />
                );
              })}
            </View>

            {/* Loading spinner while uploading */}
            {uploading && !allComplete && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Uploading...</Text>
              </View>
            )}

            {/* Reset button when all uploads complete */}
            {allComplete && (
              <View style={styles.resetButtonContainer}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Upload More Photos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  uploadSection: {
    marginBottom: 24,
  },
  progressSection: {
    gap: 16,
  },
  fileProgressSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  resetButtonContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
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
});
