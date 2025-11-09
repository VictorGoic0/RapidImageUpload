package com.rapidphoto.features.batchupload;

import java.time.Instant;
import java.util.List;

/**
 * Response containing presigned upload URLs for a batch of photos.
 * Includes a batch ID for WebSocket progress tracking.
 */
public record BatchUploadResponse(
    String batchId,
    List<PresignedUploadInfo> uploads,
    Integer totalCount,
    Instant requestedAt
) {
}

