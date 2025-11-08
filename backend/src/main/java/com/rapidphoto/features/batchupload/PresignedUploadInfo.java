package com.rapidphoto.features.batchupload;

import java.time.Instant;

/**
 * Information about a presigned upload URL for a photo.
 */
public record PresignedUploadInfo(
    String photoId,
    String fileName,
    String presignedUrl,
    String s3Key,
    Instant expiresAt
) {
}

