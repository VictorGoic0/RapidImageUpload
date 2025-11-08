import * as FileSystem from 'expo-file-system';

/**
 * Uploads a file to S3 using a presigned URL with progress tracking.
 * Uses Expo FileSystem.uploadAsync for React Native compatibility.
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
  try {
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
          onProgress(percent);
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

