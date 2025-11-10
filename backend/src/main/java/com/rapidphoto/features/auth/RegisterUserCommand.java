package com.rapidphoto.features.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Command to register a new user.
 */
public record RegisterUserCommand(
    @NotBlank(message = "Username cannot be blank")
    String username,
    
    @NotBlank(message = "Password cannot be blank")
    String password
) {
}

