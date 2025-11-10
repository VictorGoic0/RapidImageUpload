package com.rapidphoto.features.auth;

import com.rapidphoto.domain.User;
import com.rapidphoto.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Command handler for user authentication (login).
 */
@Service
public class LoginUserCommandHandler {
    
    private static final Logger log = LoggerFactory.getLogger(LoginUserCommandHandler.class);
    
    private final UserRepository userRepository;
    
    public LoginUserCommandHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public LoginUserResponse handle(LoginUserCommand command) {
        log.info("Processing login attempt for username: {}", command.username());
        
        // Find user by username
        Optional<User> userOpt = userRepository.findByUsername(command.username());
        
        if (userOpt.isEmpty()) {
            log.warn("Login failed: user not found: {}", command.username());
            throw new AuthenticationException("Invalid username or password");
        }
        
        User user = userOpt.get();
        
        // Compare passwords (plain text for MVP)
        if (!user.getPassword().equals(command.password())) {
            log.warn("Login failed: invalid password for username: {}", command.username());
            throw new AuthenticationException("Invalid username or password");
        }
        
        log.info("User logged in successfully: userId={}, username={}", 
                 user.getId(), user.getUsername());
        
        return new LoginUserResponse(user.getId(), user.getUsername());
    }
}

