package com.rapidphoto.features.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Command to authenticate a user (login).
 */
public record LoginUserCommand(
    @NotBlank(message = "Username cannot be blank")
    String username,
    
    @NotBlank(message = "Password cannot be blank")
    String password
) {
}

