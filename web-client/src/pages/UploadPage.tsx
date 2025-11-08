import { useState, useCallback, useMemo } from 'react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useThrottledProgress } from '@/hooks/useThrottledProgress';
import { UploadZone } from '@/components/UploadZone';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { BatchProgress } from '@/components/BatchProgress';
import { Loader2 } from 'lucide-react';
import type { UploadStatus, PhotoProgress } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Props for UploadPage component.
 */
interface UploadPageProps {
  websocketConnected: boolean;
  websocketProgress: Map<string, PhotoProgress>;
  websocketSendProgress: (progressData: PhotoProgress) => void;
}

/**
 * Upload page component that handles photo uploads with progress tracking.
 */
export function UploadPage({
  websocketConnected,
  websocketProgress,
  websocketSendProgress,
}: UploadPageProps) {
  // Initialize throttled progress callback
  const throttledProgress = useThrottledProgress(websocketSendProgress);

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

  // State for selected files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  // Handle files selected from UploadZone
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setSelectedFiles(files);
      setShowProgress(true);
      uploadPhotos(files);
    },
    [uploadPhotos]
  );

  // Handle reset to clear state and start over
  const handleReset = useCallback(() => {
    setSelectedFiles([]);
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
  const allComplete = selectedFiles.length > 0 && 
    Array.from(mergedProgress.values()).every(
      (info) => info.status === UPLOAD_STATUS.COMPLETED || info.status === UPLOAD_STATUS.FAILED
    );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-12 py-12">
        {/* Page title */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">Upload Photos</h1>
          
          {/* WebSocket connection status indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                websocketConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={websocketConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
              {websocketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Upload Zone - show when not uploading or when uploads are complete */}
        {(!uploading || allComplete) && (
          <div className="mb-12">
            <UploadZone onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {/* Progress section */}
        {showProgress && (
          <div className="space-y-8">
            {/* Batch progress summary */}
            <BatchProgress uploads={mergedProgress} />

            {/* Individual file progress indicators */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                File Progress
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {selectedFiles.map((file) => {
                  const progressInfo = mergedProgress.get(file.name) || {
                    fileName: file.name,
                    progress: 0,
                    status: UPLOAD_STATUS.PENDING as UploadStatus,
                  };
                  return (
                    <ProgressIndicator
                      key={file.name}
                      fileName={progressInfo.fileName}
                      progress={progressInfo.progress}
                      status={progressInfo.status}
                    />
                  );
                })}
              </div>
            </div>

            {/* Loading spinner while uploading */}
            {uploading && !allComplete && (
              <div className="flex items-center justify-center gap-3 py-8 text-gray-700 dark:text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-lg font-medium">Uploading...</span>
              </div>
            )}

            {/* Reset button when all uploads complete */}
            {allComplete && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Upload More Photos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold text-lg">Error</p>
            <p className="text-red-600 dark:text-red-300 text-base mt-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

