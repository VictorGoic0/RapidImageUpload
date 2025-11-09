import { useState, useCallback, useRef } from 'react';
import { initiateBatchUpload, completePhotoUpload } from '@/services/api';
import { uploadToS3 } from '@/services/upload';
import type { PhotoMetadata, PresignedUploadInfo, UploadStatus } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

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
 * Hook for managing photo uploads with progress tracking.
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
    async (files: File[]) => {
      // Reset state
      setUploading(true);
      setError(null);
      setUploadResults(new Map());

      // Create abort controller for cleanup
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Map files to PhotoMetadata objects
        const photoMetadata: PhotoMetadata[] = files.map((file) => ({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }));

        // Initialize upload results with PENDING status
        const initialResults = new Map<string, UploadResult>();
        files.forEach((file) => {
          initialResults.set(file.name, {
            status: UPLOAD_STATUS.PENDING,
            progress: 0,
          });
        });
        setUploadResults(initialResults);

        // Call initiateBatchUpload API with metadata
        const batchResponse = await initiateBatchUpload(userId, photoMetadata);
        
        // Store batch ID for WebSocket connection
        setBatchId(batchResponse.batchId);

        // Create a map of fileName to presigned info for easy lookup
        const presignedMap = new Map<string, PresignedUploadInfo>();
        batchResponse.uploads.forEach((uploadInfo) => {
          presignedMap.set(uploadInfo.fileName, uploadInfo);
        });

        // Upload each file to S3
        const uploadPromises = files.map(async (file) => {
          // Check if upload was aborted
          if (abortController.signal.aborted) {
            return;
          }

          const presignedInfo = presignedMap.get(file.name);
          if (!presignedInfo) {
            throw new Error(`No presigned URL found for file: ${file.name}`);
          }

          try {
            // Update status to UPLOADING
            setUploadResults((prev) => {
              const updated = new Map(prev);
              updated.set(file.name, {
                status: UPLOAD_STATUS.UPLOADING,
                progress: 0,
                photoId: presignedInfo.photoId,
              });
              return updated;
            });

            // Upload to S3 with progress tracking
            await uploadToS3(file, presignedInfo.presignedUrl, (progress) => {
              // Check if upload was aborted
              if (abortController.signal.aborted) {
                return;
              }

              // Update local progress state
              setUploadResults((prev) => {
                const updated = new Map(prev);
                const current = updated.get(file.name);
                if (current) {
                  updated.set(file.name, {
                    ...current,
                    progress,
                  });
                }
                return updated;
              });

              // Call onProgressUpdate for WebSocket throttling
              const status: UploadStatus = progress === 100 ? UPLOAD_STATUS.COMPLETED : UPLOAD_STATUS.UPLOADING;
              onProgressUpdate(presignedInfo.photoId, progress, file.name, status);
            });

            // On upload success: call completePhotoUpload API with batch ID
            await completePhotoUpload(presignedInfo.photoId, userId, presignedInfo.s3Key, batchResponse.batchId);

            // Update uploadResults Map with COMPLETED status
            setUploadResults((prev) => {
              const updated = new Map(prev);
              updated.set(file.name, {
                status: UPLOAD_STATUS.COMPLETED,
                progress: 100,
                photoId: presignedInfo.photoId,
              });
              return updated;
            });

            // Send final progress update
            onProgressUpdate(presignedInfo.photoId, 100, file.name, UPLOAD_STATUS.COMPLETED);
          } catch (uploadError) {
            // On upload failure: update uploadResults with FAILED
            const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
            let failedProgress = 0;
            setUploadResults((prev) => {
              const updated = new Map(prev);
              const current = prev.get(file.name);
              failedProgress = current?.progress || 0;
              updated.set(file.name, {
                status: UPLOAD_STATUS.FAILED,
                progress: failedProgress,
                photoId: presignedInfo.photoId,
                error: errorMessage,
              });
              return updated;
            });

            // Send failure progress update
            onProgressUpdate(presignedInfo.photoId, failedProgress, file.name, UPLOAD_STATUS.FAILED);
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

