import { useState, useCallback, useMemo } from 'react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useWebSocket } from '@/hooks/useWebSocket';
import { UploadZone } from '@/components/UploadZone';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { BatchProgress } from '@/components/BatchProgress';
import { Loader2 } from 'lucide-react';
import type { UploadStatus } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Upload page component that handles photo uploads with progress tracking.
 */
export function UploadPage() {
  // Initialize photo upload hook (no progress callback needed for raw WebSocket)
  const { uploading, error, uploadResults, batchId, uploadPhotos, cleanup } = usePhotoUpload(
    MOCK_USER_ID,
    () => {} // Empty callback since we're using raw WebSocket for progress
  );

  // Get WebSocket base URL from environment
  const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

  // Initialize WebSocket hook with batch ID
  const { progress: websocketProgress } = useWebSocket(batchId, wsBaseUrl);

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
    <div className="w-full">
      <div className="w-full px-12 py-12">
        {/* Page title */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">Upload Photos</h1>
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

