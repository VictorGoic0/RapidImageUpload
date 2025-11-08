package com.rapidphoto.features.photocompletion;

import com.rapidphoto.domain.UploadStatus;

import java.time.Instant;

/**
 * Response after completing a photo upload.
 */
public record PhotoCompletionResponse(
    String photoId,
    UploadStatus status,
    Instant uploadedAt,
    String message
) {
}

