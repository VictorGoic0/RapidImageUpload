import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { initiateBatchUpload, completePhotoUpload } from '../services/api';
import { uploadToS3 } from '../services/upload';
import type { PhotoMetadata, PresignedUploadInfo, UploadStatus } from '../types/photo';
import { UPLOAD_STATUS } from '../types/photo';

/**
 * Upload result for a single file.
 */
interface UploadResult {
  status: UploadStatus;
  progress: number;
  photoId?: string;
  error?: string;
}

/**
 * Helper function to get MIME type from file URI.
 * Infers MIME type from file extension.
 */
function getMimeTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * Helper function to extract file name from URI.
 * Falls back to a generated name if URI doesn't contain a filename.
 */
function getFileNameFromUri(uri: string): string {
  // Try to extract filename from URI
  const uriParts = uri.split('/');
  const lastPart = uriParts[uriParts.length - 1];
  
  // If it looks like a filename, use it; otherwise generate one
  if (lastPart.includes('.') && lastPart.length > 5) {
    return lastPart;
  }
  
  // Generate a filename with timestamp
  const timestamp = Date.now();
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  return `photo_${timestamp}.${extension}`;
}

/**
 * Hook for managing photo uploads with progress tracking.
 * Adapted for React Native file URIs instead of File objects.
 *
 * @param userId - The user ID
 * @param onProgressUpdate - Callback function for progress updates (for WebSocket throttling)
 * @returns Object containing upload state and uploadPhotos function
 */
export function usePhotoUpload(
  userId: string,
  onProgressUpdate: (photoId: string, progress: number, fileName: string, status: UploadStatus) => void
) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<Map<string, UploadResult>>(new Map());
  const [batchId, setBatchId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadPhotos = useCallback(
    async (fileUris: string[]) => {
      // Reset state
      setUploading(true);
      setError(null);
      setUploadResults(new Map());

      // Create abort controller for cleanup
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Map file URIs to PhotoMetadata objects
        // Need to get file info for each URI
        const photoMetadataPromises = fileUris.map(async (uri) => {
          const fileName = getFileNameFromUri(uri);
          const contentType = getMimeTypeFromUri(uri);
          let size = 0;

          // File system operations are not available on web platform
          if (Platform.OS === 'web') {
            // On web, try to fetch the file to get its size
            try {
              const response = await fetch(uri);
              const blob = await response.blob();
              size = blob.size;
            } catch (error) {
              // If fetch fails, use estimated size (default to 2MB for images)
              console.warn('[usePhotoUpload] Could not determine file size on web, using estimated size');
              size = 2 * 1024 * 1024; // 2MB default
            }
          } else {
            // On native platforms, use FileSystem API
            const fileInfo = await FileSystem.getInfoAsync(uri);
            
            if (!fileInfo.exists) {
              throw new Error(`File not found: ${uri}`);
            }

            size = fileInfo.size || 0;
          }

          return {
            fileName,
            contentType,
            size,
            uri, // Store URI for later use in upload
          };
        });

        const fileMetadata = await Promise.all(photoMetadataPromises);

        // Initialize upload results with PENDING status
        const initialResults = new Map<string, UploadResult>();
        fileMetadata.forEach((metadata) => {
          initialResults.set(metadata.fileName, {
            status: UPLOAD_STATUS.PENDING,
            progress: 0,
          });
        });
        setUploadResults(initialResults);

        // Prepare PhotoMetadata array (without uri)
        const photoMetadata: PhotoMetadata[] = fileMetadata.map(({ uri, ...metadata }) => metadata);

        // Call initiateBatchUpload API with metadata
        const batchResponse = await initiateBatchUpload(photoMetadata, userId);
        
        // Store batch ID for WebSocket connection
        setBatchId(batchResponse.batchId);

        // Create a map of fileName to presigned info for easy lookup
        const presignedMap = new Map<string, PresignedUploadInfo>();
        batchResponse.uploads.forEach((uploadInfo) => {
          presignedMap.set(uploadInfo.fileName, uploadInfo);
        });

        // Create a map of fileName to file metadata (including URI)
        const fileMetadataMap = new Map<string, typeof fileMetadata[0]>();
        fileMetadata.forEach((metadata) => {
          fileMetadataMap.set(metadata.fileName, metadata);
        });

        // Upload each file to S3
        const uploadPromises = fileMetadata.map(async (fileMeta) => {
          // Check if upload was aborted
          if (abortController.signal.aborted) {
            return;
          }

          const presignedInfo = presignedMap.get(fileMeta.fileName);
          if (!presignedInfo) {
            throw new Error(`No presigned URL found for file: ${fileMeta.fileName}`);
          }

          try {
            // Update status to UPLOADING
            setUploadResults((prev) => {
              const updated = new Map(prev);
              updated.set(fileMeta.fileName, {
                status: UPLOAD_STATUS.UPLOADING,
                progress: 0,
                photoId: presignedInfo.photoId,
              });
              return updated;
            });

            // Upload to S3 with progress tracking
            await uploadToS3(
              fileMeta.uri,
              presignedInfo.presignedUrl,
              fileMeta.contentType,
              (progress) => {
                // Check if upload was aborted
                if (abortController.signal.aborted) {
                  return;
                }

                // Update local progress state
                setUploadResults((prev) => {
                  const updated = new Map(prev);
                  const current = updated.get(fileMeta.fileName);
                  if (current) {
                    updated.set(fileMeta.fileName, {
                      ...current,
                      progress,
                    });
                  }
                  return updated;
                });

                // Call onProgressUpdate for WebSocket throttling
                const status: UploadStatus = progress === 100 ? UPLOAD_STATUS.COMPLETED : UPLOAD_STATUS.UPLOADING;
                onProgressUpdate(presignedInfo.photoId, progress, fileMeta.fileName, status);
              }
            );

            // On upload success: call completePhotoUpload API with batch ID
            await completePhotoUpload(presignedInfo.photoId, presignedInfo.s3Key, batchResponse.batchId, userId);

            // Update uploadResults Map with COMPLETED status
            setUploadResults((prev) => {
              const updated = new Map(prev);
              updated.set(fileMeta.fileName, {
                status: UPLOAD_STATUS.COMPLETED,
                progress: 100,
                photoId: presignedInfo.photoId,
              });
              return updated;
            });

            // Send final progress update
            onProgressUpdate(presignedInfo.photoId, 100, fileMeta.fileName, UPLOAD_STATUS.COMPLETED);
          } catch (uploadError) {
            // On upload failure: update uploadResults with FAILED
            const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
            let failedProgress = 0;
            setUploadResults((prev) => {
              const updated = new Map(prev);
              const current = prev.get(fileMeta.fileName);
              failedProgress = current?.progress || 0;
              updated.set(fileMeta.fileName, {
                status: UPLOAD_STATUS.FAILED,
                progress: failedProgress,
                photoId: presignedInfo.photoId,
                error: errorMessage,
              });
              return updated;
            });

            // Send failure progress update
            onProgressUpdate(presignedInfo.photoId, failedProgress, fileMeta.fileName, UPLOAD_STATUS.FAILED);
          }
        });

        // Use Promise.allSettled to handle all uploads
        await Promise.allSettled(uploadPromises);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during upload';
        setError(errorMessage);
        console.error('[usePhotoUpload] Upload error:', err);
      } finally {
        // Set uploading to false when all complete
        if (!abortController.signal.aborted) {
          setUploading(false);
        }
        abortControllerRef.current = null;
      }
    },
    [userId, onProgressUpdate]
  );

  // Cleanup function for component unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    uploading,
    error,
    uploadResults,
    batchId,
    uploadPhotos,
    cleanup,
  };
}

