import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  BatchUploadResponse,
  Photo,
  PhotoCompletionResponse,
  PhotoMetadata,
  PhotoQueryResponse,
} from '@/types/photo';

/**
 * Creates and configures an axios instance for API requests.
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const timeout = 30000; // 30 seconds

  const apiClient = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for logging (optional, only in development)
  apiClient.interceptors.request.use(
    (config) => {
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data as { error?: string } | undefined;
        const message = data?.error || error.message || 'An error occurred';

        console.error(`[API Error] ${status}: ${message}`, error.response.data);

        // Create a more descriptive error
        const apiError = new Error(message);
        (apiError as any).status = status;
        (apiError as any).data = error.response.data;
        return Promise.reject(apiError);
      } else if (error.request) {
        // Request was made but no response received
        console.error('[API Error] No response received', error.request);
        return Promise.reject(new Error('Network error: No response from server'));
      } else {
        // Error setting up the request
        console.error('[API Error] Request setup failed', error.message);
        return Promise.reject(error);
      }
    }
  );

  return apiClient;
};

const apiClient = createApiClient();

/**
 * Initiates a batch upload by requesting presigned URLs for multiple photos.
 *
 * @param userId - The user ID
 * @param photos - Array of photo metadata
 * @returns Promise resolving to batch upload response with presigned URLs
 * @throws Error if the request fails
 */
export async function initiateBatchUpload(
  userId: string,
  photos: PhotoMetadata[]
): Promise<BatchUploadResponse> {
  try {
    const response = await apiClient.post<BatchUploadResponse>(
      '/api/photos/batch-init',
      { photos },
      {
        params: { userId },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Completes a photo upload by notifying the backend that the file has been uploaded to S3.
 *
 * @param photoId - The photo ID
 * @param userId - The user ID
 * @param s3Key - The S3 key where the file was uploaded
 * @returns Promise resolving to completion response with status
 * @throws Error if the request fails
 */
export async function completePhotoUpload(
  photoId: string,
  userId: string,
  s3Key: string
): Promise<PhotoCompletionResponse> {
  try {
    const response = await apiClient.post<PhotoCompletionResponse>(
      `/api/photos/${photoId}/complete`,
      { s3Key },
      {
        params: { userId },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a paginated list of photos for a user.
 *
 * @param userId - The user ID
 * @param page - Page number (0-indexed, default: 0)
 * @param size - Page size (default: 20)
 * @returns Promise resolving to photo query response with pagination metadata
 * @throws Error if the request fails
 */
export async function getUserPhotos(
  userId: string,
  page: number = 0,
  size: number = 20
): Promise<PhotoQueryResponse> {
  try {
    const response = await apiClient.get<PhotoQueryResponse>('/api/photos', {
      params: { userId, page, size },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a single photo by ID.
 *
 * @param photoId - The photo ID
 * @param userId - The user ID
 * @returns Promise resolving to photo data
 * @throws Error if the request fails or photo is not found
 */
export async function getPhotoById(photoId: string, userId: string): Promise<Photo> {
  try {
    const response = await apiClient.get<Photo>(`/api/photos/${photoId}`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

