package com.rapidphoto.features.batchupload;

import java.time.Instant;
import java.util.List;

/**
 * Response containing presigned upload URLs for a batch of photos.
 */
public record BatchUploadResponse(
    List<PresignedUploadInfo> uploads,
    Integer totalCount,
    Instant requestedAt
) {
}

