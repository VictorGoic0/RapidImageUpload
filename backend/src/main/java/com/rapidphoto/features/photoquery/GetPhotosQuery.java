package com.rapidphoto.features.photoquery;

import com.rapidphoto.domain.UserId;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Query object for retrieving paginated photos for a user.
 */
public record GetPhotosQuery(
    @NotNull(message = "UserId cannot be null")
    UserId userId,
    
    @Min(value = 0, message = "Page must be >= 0")
    Integer page,
    
    @Min(value = 1, message = "Size must be >= 1")
    @Max(value = 100, message = "Size must be <= 100")
    Integer size
) {
    public GetPhotosQuery {
        // Default values
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
    }
}

