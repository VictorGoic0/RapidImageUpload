/**
 * Upload status type matching backend UploadStatus enum.
 */
export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

/**
 * Upload status constants matching backend UploadStatus enum values.
 * Use these constants instead of hard-coded strings for type safety and maintainability.
 */
export const UPLOAD_STATUS = {
  PENDING: 'PENDING' as const,
  UPLOADING: 'UPLOADING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
} as const;

/**
 * Metadata for a photo to be uploaded in a batch.
 * Matches PhotoMetadata from backend.
 */
export interface PhotoMetadata {
  /** The name of the file */
  fileName: string;
  /** MIME type of the file (e.g., 'image/jpeg') */
  contentType: string;
  /** File size in bytes */
  size: number;
}

/**
 * Information about a presigned upload URL for a photo.
 * Matches PresignedUploadInfo from backend.
 */
export interface PresignedUploadInfo {
  /** Unique identifier for the photo */
  photoId: string;
  /** The name of the file */
  fileName: string;
  /** Presigned URL for uploading to S3 */
  presignedUrl: string;
  /** S3 key where the file will be stored */
  s3Key: string;
  /** Expiration timestamp for the presigned URL (ISO 8601 string) */
  expiresAt: string;
}

/**
 * Response containing presigned upload URLs for a batch of photos.
 * Matches BatchUploadResponse from backend.
 */
export interface BatchUploadResponse {
  /** List of presigned upload information for each photo */
  uploads: PresignedUploadInfo[];
  /** Total number of photos in the batch */
  totalCount: number;
  /** Timestamp when the batch upload was requested (ISO 8601 string) */
  requestedAt: string;
}

/**
 * Photo data transfer object matching PhotoDto from backend.
 */
export interface Photo {
  /** Unique identifier for the photo */
  photoId: string;
  /** The name of the file */
  fileName: string;
  /** Current upload status */
  status: UploadStatus;
  /** File size in bytes */
  fileSize: number;
  /** MIME type of the file */
  contentType: string;
  /** Timestamp when the photo was created (ISO 8601 string) */
  createdAt: string;
  /** Timestamp when the photo upload was completed (ISO 8601 string, nullable) */
  uploadedAt: string | null;
  /** Presigned download URL (null if photo is not COMPLETED) */
  downloadUrl: string | null;
}

/**
 * Photo upload progress update sent via WebSocket.
 * Matches PhotoProgress from backend.
 */
export interface PhotoProgress {
  /** Unique identifier for the photo */
  photoId: string;
  /** The name of the file */
  fileName: string;
  /** Current upload status */
  status: UploadStatus;
  /** Upload progress percentage (0-100) */
  progressPercentage: number;
  /** Status message */
  message: string;
  /** Timestamp of the progress update (ISO 8601 string) */
  timestamp: string;
}

/**
 * Response object for photo query operations with pagination metadata.
 * Matches PhotoQueryResponse from backend.
 */
export interface PhotoQueryResponse {
  /** List of photos for the current page */
  photos: Photo[];
  /** Current page number (0-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of photos across all pages */
  totalElements: number;
  /** Number of photos per page */
  pageSize: number;
}

/**
 * Response after completing a photo upload.
 * Matches PhotoCompletionResponse from backend.
 */
export interface PhotoCompletionResponse {
  /** Unique identifier for the photo */
  photoId: string;
  /** Current upload status */
  status: UploadStatus;
  /** Timestamp when the photo upload was completed (ISO 8601 string) */
  uploadedAt: string;
  /** Status message */
  message: string;
}

