import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import type { Photo } from '@/types/photo';
import { UPLOAD_STATUS } from '@/types/photo';

/**
 * Props for PhotoCard component.
 */
interface PhotoCardProps {
  photo: Photo;
}

/**
 * Formats file size from bytes to human-readable format (KB/MB).
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats upload date to a readable string.
 */
function formatUploadDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Gets status badge color based on upload status.
 */
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case UPLOAD_STATUS.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case UPLOAD_STATUS.UPLOADING:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case UPLOAD_STATUS.FAILED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case UPLOAD_STATUS.PENDING:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

/**
 * Photo card component that displays a single photo with metadata and download functionality.
 */
export function PhotoCard({ photo }: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);

  const openImageInNewTab = () => {
    if (photo.downloadUrl && photo.status === UPLOAD_STATUS.COMPLETED) {
      window.open(photo.downloadUrl, '_blank');
    }
  };

  const isDownloadDisabled = photo.status !== UPLOAD_STATUS.COMPLETED || !photo.downloadUrl;
  const isCardClickable = photo.status === UPLOAD_STATUS.COMPLETED && photo.downloadUrl;
  const truncatedFileName =
    photo.fileName.length > 30 ? `${photo.fileName.substring(0, 30)}...` : photo.fileName;
  const showImage = photo.downloadUrl && photo.status === UPLOAD_STATUS.COMPLETED && !imageError;

  return (
    <div
      onClick={isCardClickable ? openImageInNewTab : undefined}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden hover:scale-[1.02] ${
        isCardClickable ? 'cursor-pointer' : ''
      }`}
    >
      {/* Image container */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {showImage ? (
          <img
            src={photo.downloadUrl || ''}
            alt={photo.fileName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Metadata section */}
      <div className="p-4 space-y-3">
        {/* File name */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1"
            title={photo.fileName}
          >
            {truncatedFileName}
          </h3>
        </div>

        {/* File size and date */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{formatFileSize(photo.fileSize)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatUploadDate(photo.uploadedAt || photo.createdAt)}</span>
          </div>
        </div>

        {/* Status badge and download button */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(photo.status)}`}
          >
            {photo.status}
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            disabled={isDownloadDisabled}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              isDownloadDisabled
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
            title={isDownloadDisabled ? 'Download not available' : 'Download photo'}
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

