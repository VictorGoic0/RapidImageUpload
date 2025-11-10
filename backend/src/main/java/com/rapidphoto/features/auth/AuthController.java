package com.rapidphoto.features.auth;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for authentication endpoints (register and login).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    private final RegisterUserCommandHandler registerHandler;
    private final LoginUserCommandHandler loginHandler;
    
    public AuthController(
            RegisterUserCommandHandler registerHandler,
            LoginUserCommandHandler loginHandler) {
        this.registerHandler = registerHandler;
        this.loginHandler = loginHandler;
    }
    
    /**
     * Register a new user.
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for username: {}", request.username());
        
        try {
            RegisterUserCommand command = new RegisterUserCommand(
                request.username(),
                request.password()
            );
            
            RegisterUserResponse response = registerHandler.handle(command);
            
            log.info("Registration successful: userId={}, username={}", 
                     response.userId(), response.username());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (DuplicateUsernameException e) {
            log.warn("Registration failed: duplicate username: {}", request.username());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            
        } catch (Exception e) {
            log.error("Unexpected error during registration: {}", request.username(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Authenticate a user (login).
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for username: {}", request.username());
        
        try {
            LoginUserCommand command = new LoginUserCommand(
                request.username(),
                request.password()
            );
            
            LoginUserResponse response = loginHandler.handle(command);
            
            log.info("Login successful: userId={}, username={}", 
                     response.userId(), response.username());
            
            return ResponseEntity.ok(response);
            
        } catch (AuthenticationException e) {
            log.warn("Login failed: invalid credentials for username: {}", request.username());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            
        } catch (Exception e) {
            log.error("Unexpected error during login: {}", request.username(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Request DTO for user registration.
     */
    public record RegisterRequest(
        @jakarta.validation.constraints.NotBlank(message = "Username cannot be blank")
        String username,
        
        @jakarta.validation.constraints.NotBlank(message = "Password cannot be blank")
        String password
    ) {
    }
    
    /**
     * Request DTO for user login.
     */
    public record LoginRequest(
        @jakarta.validation.constraints.NotBlank(message = "Username cannot be blank")
        String username,
        
        @jakarta.validation.constraints.NotBlank(message = "Password cannot be blank")
        String password
    ) {
    }
}

