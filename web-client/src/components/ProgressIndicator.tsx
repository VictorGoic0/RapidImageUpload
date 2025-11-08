import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import type { UploadStatus } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

/**
 * Props for the ProgressIndicator component.
 */
interface ProgressIndicatorProps {
  /** The name of the file */
  fileName: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current upload status */
  status: UploadStatus;
}

/**
 * Helper function to get the status icon based on upload status.
 */
function getStatusIcon(status: UploadStatus) {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return <CheckCircle className="w-7 h-7 text-green-500" />;
    case UPLOAD_STATUS.FAILED:
      return <XCircle className="w-7 h-7 text-red-500" />;
    case UPLOAD_STATUS.UPLOADING:
      return <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />;
    case UPLOAD_STATUS.PENDING:
      return <Clock className="w-7 h-7 text-gray-400" />;
    default:
      return <Clock className="w-7 h-7 text-gray-400" />;
  }
}

/**
 * Helper function to get the progress bar color based on status.
 */
function getProgressBarColor(status: UploadStatus): string {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return 'bg-green-500';
    case UPLOAD_STATUS.FAILED:
      return 'bg-red-500';
    case UPLOAD_STATUS.UPLOADING:
      return 'bg-blue-500';
    case UPLOAD_STATUS.PENDING:
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Component for displaying individual file upload progress.
 */
export function ProgressIndicator({ fileName, progress, status }: ProgressIndicatorProps) {
  // Truncate file name if too long (desktop: allow longer names)
  const displayFileName = fileName.length > 80 ? `${fileName.substring(0, 80)}...` : fileName;

  return (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Status icon on left */}
      <div className="flex-shrink-0">
        {getStatusIcon(status)}
      </div>

      {/* File name and progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayFileName}
          </p>
          <span className="text-base font-bold text-gray-700 dark:text-gray-300 ml-4 whitespace-nowrap">
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Progress bar container */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          {/* Filled progress bar */}
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor(status)} shadow-sm`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

