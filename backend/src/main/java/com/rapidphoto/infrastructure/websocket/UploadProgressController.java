package com.rapidphoto.infrastructure.websocket;

import com.rapidphoto.domain.UserId;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller for handling photo upload progress messages from clients.
 * Receives progress updates and broadcasts them to connected users.
 */
@Controller
public class UploadProgressController {

    private static final Logger log = LoggerFactory.getLogger(UploadProgressController.class);
    
    private final WebSocketProgressService webSocketProgressService;

    public UploadProgressController(WebSocketProgressService webSocketProgressService) {
        this.webSocketProgressService = webSocketProgressService;
    }

    /**
     * Handles progress update messages from clients.
     * Validates progress percentage and broadcasts to the user.
     * 
     * @param progress The progress update payload
     * @param principal The authenticated user principal (for MVP: mock userId)
     */
    @MessageMapping("/upload-progress")
    public void handleProgressUpdate(@Payload @Valid PhotoProgress progress, Principal principal) {
        log.info("Received progress update: photoId={}, status={}, progress={}%",
            progress.photoId(), progress.status(), progress.progressPercentage());
        
        // Validate progress percentage
        if (progress.progressPercentage() < 0 || progress.progressPercentage() > 100) {
            log.warn("Invalid progress percentage: {}. Must be between 0 and 100.", progress.progressPercentage());
            return;
        }
        
        try {
            // Extract userId from Principal (for MVP: use mock/hardcoded userId)
            // TODO: Replace with actual authentication when JWT is implemented
            UserId userId = extractUserId(principal);
            
            // Send progress update to the user
            webSocketProgressService.sendProgressToUser(userId, progress);
            
            log.debug("Processed progress update for user {}: photoId={}",
                userId.value(), progress.photoId());
        } catch (Exception e) {
            log.error("Error processing progress update: {}", e.getMessage(), e);
        }
    }

    /**
     * Extracts UserId from Principal.
     * For MVP: uses a hardcoded/mock userId since authentication is not yet implemented.
     * 
     * @param principal The authenticated principal
     * @return UserId extracted from principal
     */
    private UserId extractUserId(Principal principal) {
        // TODO: Replace with actual authentication when JWT is implemented
        // For MVP, use a mock userId or extract from principal name if available
        if (principal != null && principal.getName() != null) {
            try {
                return UserId.fromString(principal.getName());
            } catch (IllegalArgumentException e) {
                log.warn("Could not parse userId from principal name: {}. Using mock userId.", principal.getName());
            }
        }
        
        // Mock userId for MVP (hardcoded UUID)
        // This will be replaced with actual authentication in post-MVP
        return UserId.fromString("00000000-0000-0000-0000-000000000000");
    }
}

