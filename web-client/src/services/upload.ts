/**
 * Uploads a file to S3 using a presigned URL with progress tracking.
 *
 * @param file - The file to upload
 * @param presignedUrl - The presigned URL for uploading to S3
 * @param onProgress - Callback function that receives upload progress (0-100)
 * @returns Promise that resolves when the upload is complete
 * @throws Error if the upload fails
 */
export async function uploadToS3(
  file: File,
  presignedUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
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

    // Set content type header matching the file type
    xhr.setRequestHeader('Content-Type', file.type);

    // Send the file
    xhr.send(file);
  });
}

