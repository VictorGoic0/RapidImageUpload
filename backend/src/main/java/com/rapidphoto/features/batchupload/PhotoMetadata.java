package com.rapidphoto.features.batchupload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Metadata for a photo to be uploaded in a batch.
 */
public record PhotoMetadata(
    @NotBlank(message = "File name cannot be blank")
    String fileName,
    
    @NotBlank(message = "Content type cannot be blank")
    String contentType,
    
    @Positive(message = "File size must be positive")
    Long size
) {
}

