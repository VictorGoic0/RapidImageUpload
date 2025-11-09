package com.rapidphoto.features.photocompletion;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Command to complete a photo upload after the file has been uploaded to S3.
 * Optionally includes batch ID for WebSocket progress tracking.
 */
public record CompletePhotoUploadCommand(
    @NotNull(message = "Photo ID cannot be null")
    PhotoId photoId,
    
    @NotNull(message = "User ID cannot be null")
    UserId userId,
    
    @NotBlank(message = "S3 key cannot be blank")
    String s3Key,
    
    // Optional: batch ID for WebSocket progress updates
    String batchId
) {
}

