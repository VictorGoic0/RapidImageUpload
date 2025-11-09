package com.rapidphoto.infrastructure.websocket;

import com.rapidphoto.domain.UploadStatus;
import java.time.Instant;

/**
 * DTO for batch upload progress updates sent via WebSocket.
 * Includes both batch-level and photo-level progress information.
 */
public record BatchUploadProgress(
    String batchId,
    String photoId,
    String fileName,
    UploadStatus status,
    Integer progressPercentage,
    Integer totalPhotos,
    Integer completedPhotos,
    String message,
    Instant timestamp
) {
    
    /**
     * Creates progress for a photo being uploaded.
     */
    public static BatchUploadProgress uploading(
            String batchId,
            String photoId,
            String fileName,
            Integer progressPercentage,
            Integer totalPhotos,
            Integer completedPhotos) {
        return new BatchUploadProgress(
            batchId,
            photoId,
            fileName,
            UploadStatus.UPLOADING,
            progressPercentage,
            totalPhotos,
            completedPhotos,
            "Upload in progress",
            Instant.now()
        );
    }
    
    /**
     * Creates progress for a completed photo upload.
     */
    public static BatchUploadProgress completed(
            String batchId,
            String photoId,
            String fileName,
            Integer totalPhotos,
            Integer completedPhotos) {
        return new BatchUploadProgress(
            batchId,
            photoId,
            fileName,
            UploadStatus.COMPLETED,
            100,
            totalPhotos,
            completedPhotos,
            "Upload completed successfully",
            Instant.now()
        );
    }
    
    /**
     * Creates progress for a failed photo upload.
     */
    public static BatchUploadProgress failed(
            String batchId,
            String photoId,
            String fileName,
            Integer totalPhotos,
            Integer completedPhotos,
            String error) {
        return new BatchUploadProgress(
            batchId,
            photoId,
            fileName,
            UploadStatus.FAILED,
            0,
            totalPhotos,
            completedPhotos,
            error != null ? error : "Upload failed",
            Instant.now()
        );
    }
}

