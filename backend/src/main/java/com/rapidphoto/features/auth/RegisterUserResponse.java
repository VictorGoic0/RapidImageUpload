package com.rapidphoto.features.auth;

import java.util.UUID;

/**
 * Response DTO for user registration.
 */
public record RegisterUserResponse(
    UUID userId,
    String username
) {
}

