package com.rapidphoto.infrastructure.websocket;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending photo upload progress updates via WebSocket.
 * Supports both user-specific messages (queue) and topic broadcasting.
 */
@Service
public class WebSocketProgressService {

    private static final Logger log = LoggerFactory.getLogger(WebSocketProgressService.class);
    
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketProgressService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends progress update to a specific user via user-specific queue.
     * 
     * @param userId The user identifier
     * @param progress The progress update
     */
    public void sendProgressToUser(UserId userId, PhotoProgress progress) {
        try {
            String destination = "/queue/progress";
            String userDestination = "/user/" + userId.value().toString() + destination;
            
            messagingTemplate.convertAndSendToUser(
                userId.value().toString(),
                destination,
                progress
            );
            
            log.debug("Sent progress update to user {}: photoId={}, status={}, progress={}%",
                userId.value(), progress.photoId(), progress.status(), progress.progressPercentage());
        } catch (Exception e) {
            log.error("Failed to send progress update to user {}: {}", userId.value(), e.getMessage(), e);
        }
    }

    /**
     * Broadcasts progress update to all subscribers of the progress topic.
     * 
     * @param progress The progress update
     */
    public void broadcastProgress(PhotoProgress progress) {
        try {
            String destination = "/topic/progress";
            messagingTemplate.convertAndSend(destination, progress);
            
            log.debug("Broadcasted progress update: photoId={}, status={}, progress={}%",
                progress.photoId(), progress.status(), progress.progressPercentage());
        } catch (Exception e) {
            log.error("Failed to broadcast progress update: {}", e.getMessage(), e);
        }
    }

    /**
     * Notifies a user that a photo upload has completed successfully.
     * 
     * @param userId The user identifier
     * @param photoId The photo identifier
     * @param fileName The file name
     */
    public void notifyUploadComplete(UserId userId, PhotoId photoId, String fileName) {
        PhotoProgress progress = PhotoProgress.completed(photoId.value().toString(), fileName);
        sendProgressToUser(userId, progress);
        log.info("Notified user {} of completed upload: photoId={}, fileName={}",
            userId.value(), photoId.value(), fileName);
    }

    /**
     * Notifies a user that a photo upload has failed.
     * 
     * @param userId The user identifier
     * @param photoId The photo identifier
     * @param fileName The file name
     * @param error The error message
     */
    public void notifyUploadFailed(UserId userId, PhotoId photoId, String fileName, String error) {
        PhotoProgress progress = PhotoProgress.failed(photoId.value().toString(), fileName, error);
        sendProgressToUser(userId, progress);
        log.warn("Notified user {} of failed upload: photoId={}, fileName={}, error={}",
            userId.value(), photoId.value(), fileName, error);
    }
}

