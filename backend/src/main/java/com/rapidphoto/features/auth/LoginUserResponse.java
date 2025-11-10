package com.rapidphoto.features.auth;

import java.util.UUID;

/**
 * Response DTO for user login.
 */
public record LoginUserResponse(
    UUID userId,
    String username
) {
}

