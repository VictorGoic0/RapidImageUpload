package com.rapidphoto.infrastructure.websocket;

import com.rapidphoto.domain.UploadStatus;
import java.time.Instant;

/**
 * DTO for photo upload progress updates sent via WebSocket.
 * Contains photo identification, status, progress percentage, and metadata.
 */
public record PhotoProgress(
    String photoId,
    String fileName,
    UploadStatus status,
    Integer progressPercentage,
    String message,
    Instant timestamp
) {
    
    /**
     * Creates a PhotoProgress for an uploading photo.
     * 
     * @param photoId The photo identifier
     * @param fileName The file name
     * @param progressPercentage Progress percentage (0-100)
     * @return PhotoProgress with UPLOADING status
     */
    public static PhotoProgress uploading(String photoId, String fileName, Integer progressPercentage) {
        return new PhotoProgress(
            photoId,
            fileName,
            UploadStatus.UPLOADING,
            progressPercentage,
            "Upload in progress",
            Instant.now()
        );
    }
    
    /**
     * Creates a PhotoProgress for a completed upload.
     * 
     * @param photoId The photo identifier
     * @param fileName The file name
     * @return PhotoProgress with COMPLETED status and 100% progress
     */
    public static PhotoProgress completed(String photoId, String fileName) {
        return new PhotoProgress(
            photoId,
            fileName,
            UploadStatus.COMPLETED,
            100,
            "Upload completed successfully",
            Instant.now()
        );
    }
    
    /**
     * Creates a PhotoProgress for a failed upload.
     * 
     * @param photoId The photo identifier
     * @param fileName The file name
     * @param error The error message
     * @return PhotoProgress with FAILED status
     */
    public static PhotoProgress failed(String photoId, String fileName, String error) {
        return new PhotoProgress(
            photoId,
            fileName,
            UploadStatus.FAILED,
            0,
            error != null ? error : "Upload failed",
            Instant.now()
        );
    }
}

