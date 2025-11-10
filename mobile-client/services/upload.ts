import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Uploads a file to S3 using a presigned URL with progress tracking.
 * Platform-specific implementation:
 * - Native (iOS/Android): Uses Expo FileSystem.uploadAsync
 * - Web: Uses XMLHttpRequest (expo-file-system not available on web)
 *
 * @param fileUri - The local file URI to upload
 * @param presignedUrl - The presigned URL for uploading to S3
 * @param contentType - The MIME type of the file
 * @param onProgress - Callback function that receives upload progress (0-100)
 * @returns Promise that resolves when the upload is complete
 * @throws Error if the upload fails
 */
export async function uploadToS3(
  fileUri: string,
  presignedUrl: string,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  if (Platform.OS === 'web') {
    // Web platform: use XMLHttpRequest
    return new Promise((resolve, reject) => {
      // Fetch the file as a blob
      fetch(fileUri)
        .then((response) => response.blob())
        .then((blob) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(100);
              resolve();
            } else {
              reject(
                new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`)
              );
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed: Network error'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload was aborted'));
          });

          // Configure and send the request
          xhr.open('PUT', presignedUrl);
          xhr.setRequestHeader('Content-Type', contentType);
          xhr.send(blob);
        })
        .catch((error) => {
          reject(new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        });
    });
  } else {
    // Native platform: use Expo FileSystem API
    try {
      // Throttle progress updates to prevent overwhelming React Native bridge
      let lastProgressTime = 0;
      const THROTTLE_MS = 100;

      await FileSystem.uploadAsync(presignedUrl, fileUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': contentType,
        },
        uploadProgressCallback: (uploadProgressEvent) => {
          const { totalBytesSent, totalBytesExpectedToSend } = uploadProgressEvent;
          if (totalBytesExpectedToSend > 0) {
            const percent = Math.round((totalBytesSent / totalBytesExpectedToSend) * 100);
            const now = Date.now();
            
            // Only call onProgress if enough time has passed or if upload is complete
            if (now - lastProgressTime >= THROTTLE_MS || percent === 100) {
              onProgress(percent);
              lastProgressTime = now;
            }
          }
        },
      });

      // Ensure 100% is reported on completion
      onProgress(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }
}

