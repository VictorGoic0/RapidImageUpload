import type { UploadStatus } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

/**
 * Upload information for a single file.
 */
interface UploadInfo {
  fileName: string;
  progress: number;
  status: UploadStatus;
}

/**
 * Props for the BatchProgress component.
 */
interface BatchProgressProps {
  /** Map of file names to upload information */
  uploads: Map<string, UploadInfo>;
}

/**
 * Component for displaying batch upload progress summary.
 */
export function BatchProgress({ uploads }: BatchProgressProps) {
  // Convert Map to Array for calculations
  const uploadArray = Array.from(uploads.values());
  const totalUploads = uploadArray.length;

  // Calculate overall progress percentage
  // Sum all individual progress values and divide by total number of uploads
  const overallProgress =
    totalUploads > 0
      ? uploadArray.reduce((sum, upload) => sum + upload.progress, 0) / totalUploads
      : 0;

  // Count completed uploads
  const completedCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.COMPLETED).length;

  // Count failed uploads
  const failedCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.FAILED).length;

  // Count uploading uploads
  const uploadingCount = uploadArray.filter((upload) => upload.status === UPLOAD_STATUS.UPLOADING).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} of ${totalUploads} photos`
          : `Uploaded ${totalUploads} photos`}
      </h3>

      {/* Large progress bar for batch */}
      <div className="mb-4">
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(overallProgress)}%
          </span>
        </div>
      </div>

      {/* Count summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-green-600 dark:text-green-400">{completedCount}</span> completed
        </span>
        {failedCount > 0 && (
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-red-600 dark:text-red-400">{failedCount}</span> failed
          </span>
        )}
        {uploadingCount > 0 && (
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">{uploadingCount}</span> uploading
          </span>
        )}
      </div>
    </div>
  );
}

