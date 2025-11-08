package com.rapidphoto.features.photoquery;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import jakarta.validation.constraints.NotNull;

/**
 * Query object for retrieving a single photo by ID.
 */
public record GetPhotoByIdQuery(
    @NotNull(message = "PhotoId cannot be null")
    PhotoId photoId,
    
    @NotNull(message = "UserId cannot be null")
    UserId userId
) {
}

