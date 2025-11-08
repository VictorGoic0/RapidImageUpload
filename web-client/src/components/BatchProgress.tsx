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
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-lg">
      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} of ${totalUploads} photos`
          : `Uploaded ${totalUploads} photos`}
      </h3>

      {/* Large progress bar for batch */}
      <div className="mb-6">
        <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-blue-500 transition-all duration-300 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(overallProgress)}%
          </span>
        </div>
      </div>

      {/* Count summary */}
      <div className="flex items-center gap-6 text-base">
        <span className="text-gray-700 dark:text-gray-300">
          <span className="font-bold text-green-600 dark:text-green-400 text-lg">{completedCount}</span> completed
        </span>
        {failedCount > 0 && (
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-bold text-red-600 dark:text-red-400 text-lg">{failedCount}</span> failed
          </span>
        )}
        {uploadingCount > 0 && (
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{uploadingCount}</span> uploading
          </span>
        )}
      </div>
    </div>
  );
}

