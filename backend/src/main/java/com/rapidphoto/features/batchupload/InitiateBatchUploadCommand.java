package com.rapidphoto.features.batchupload;

import com.rapidphoto.domain.UserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Command to initiate a batch photo upload.
 */
public record InitiateBatchUploadCommand(
    @NotNull(message = "User ID cannot be null")
    UserId userId,
    
    @NotEmpty(message = "Photos list cannot be empty")
    @Size(max = 100, message = "Maximum 100 photos allowed per batch")
    @Valid
    List<PhotoMetadata> photos
) {
}

