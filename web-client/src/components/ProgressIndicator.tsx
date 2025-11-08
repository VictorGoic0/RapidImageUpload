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
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case UPLOAD_STATUS.FAILED:
      return <XCircle className="w-5 h-5 text-red-500" />;
    case UPLOAD_STATUS.UPLOADING:
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case UPLOAD_STATUS.PENDING:
      return <Clock className="w-5 h-5 text-gray-400" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
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
  // Truncate file name if too long
  const displayFileName = fileName.length > 40 ? `${fileName.substring(0, 40)}...` : fileName;

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Status icon on left */}
      <div className="flex-shrink-0">
        {getStatusIcon(status)}
      </div>

      {/* File name and progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {displayFileName}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Progress bar container */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Filled progress bar */}
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor(status)}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

