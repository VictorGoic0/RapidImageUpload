package com.rapidphoto.features.photoquery;

import java.util.List;

/**
 * Response object for photo query operations with pagination metadata.
 */
public record PhotoQueryResponse(
    List<PhotoDto> photos,
    Integer currentPage,
    Integer totalPages,
    Long totalElements,
    Integer pageSize
) {
}

