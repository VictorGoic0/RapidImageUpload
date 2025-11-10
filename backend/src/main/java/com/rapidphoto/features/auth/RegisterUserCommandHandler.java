package com.rapidphoto.features.auth;

import com.rapidphoto.domain.User;
import com.rapidphoto.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command handler for user registration.
 */
@Service
public class RegisterUserCommandHandler {
    
    private static final Logger log = LoggerFactory.getLogger(RegisterUserCommandHandler.class);
    
    private final UserRepository userRepository;
    
    public RegisterUserCommandHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Transactional
    public RegisterUserResponse handle(RegisterUserCommand command) {
        log.info("Processing user registration for username: {}", command.username());
        
        // Check if username already exists
        if (userRepository.existsByUsername(command.username())) {
            log.warn("Registration failed: username already exists: {}", command.username());
            throw new DuplicateUsernameException("Username already exists: " + command.username());
        }
        
        // Create new user
        User user = User.create(command.username(), command.password());
        
        // Save to database
        User savedUser = userRepository.save(user);
        
        log.info("User registered successfully: userId={}, username={}", 
                 savedUser.getId(), savedUser.getUsername());
        
        return new RegisterUserResponse(savedUser.getId(), savedUser.getUsername());
    }
}

