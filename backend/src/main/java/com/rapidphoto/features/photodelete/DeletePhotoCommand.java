package com.rapidphoto.features.photodelete;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import jakarta.validation.constraints.NotNull;

/**
 * Command to delete a photo.
 * Includes userId for authorization.
 */
public record DeletePhotoCommand(
    @NotNull(message = "Photo ID cannot be null")
    PhotoId photoId,
    
    @NotNull(message = "User ID cannot be null")
    UserId userId
) {
}

