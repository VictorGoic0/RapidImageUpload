package com.rapidphoto.features.photocompletion;

import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.domain.UserId;
import com.rapidphoto.infrastructure.s3.S3Service;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import com.rapidphoto.infrastructure.websocket.WebSocketProgressService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Command handler for photo completion operations.
 * Verifies S3 upload and marks photo as completed.
 */
@Service
public class PhotoCompletionCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(PhotoCompletionCommandHandler.class);

    private final PhotoRepository photoRepository;
    private final S3Service s3Service;
    private final WebSocketProgressService webSocketService;

    public PhotoCompletionCommandHandler(
            PhotoRepository photoRepository,
            S3Service s3Service,
            WebSocketProgressService webSocketService) {
        this.photoRepository = photoRepository;
        this.s3Service = s3Service;
        this.webSocketService = webSocketService;
    }

    @Transactional
    public PhotoCompletionResponse handle(CompletePhotoUploadCommand command) {
        log.info("Processing photo completion: photoId={}, userId={}, s3Key={}",
                 command.photoId().value(), command.userId().value(), command.s3Key());

        try {
            // Find photo by ID and userId
            Optional<Photo> photoOpt = photoRepository.findByIdAndUserId(
                    command.photoId(), command.userId());

            if (photoOpt.isEmpty()) {
                log.warn("Photo not found: photoId={}, userId={}",
                        command.photoId().value(), command.userId().value());
                throw new PhotoNotFoundException(
                    String.format("Photo not found for photoId=%s and userId=%s",
                            command.photoId().value(), command.userId().value()));
            }

            Photo photo = photoOpt.get();

            // Verify S3 object exists
            log.debug("Verifying S3 object existence: s3Key={}", command.s3Key());
            boolean objectExists = s3Service.verifyObjectExists(command.s3Key());

            if (!objectExists) {
                log.error("S3 object verification failed: s3Key={}, photoId={}",
                         command.s3Key(), command.photoId().value());
                throw new S3VerificationException(
                    String.format("S3 upload verification failed: object does not exist at key=%s",
                            command.s3Key()));
            }

            // Mark photo as completed (domain method handles state validation)
            try {
                photo.markAsCompleted(command.s3Key());
            } catch (IllegalStateException e) {
                log.error("Invalid state transition for photo: photoId={}, currentStatus={}, error={}",
                         command.photoId().value(), photo.getStatus(), e.getMessage());
                throw new IllegalStateException(
                    String.format("Cannot complete photo upload. Current status: %s. Error: %s",
                            photo.getStatus(), e.getMessage()), e);
            }

            // Save updated photo to database
            Photo savedPhoto = photoRepository.save(photo);
            log.info("Photo marked as completed: photoId={}, s3Key={}, uploadedAt={}",
                    command.photoId().value(), command.s3Key(), savedPhoto.getUploadedAt());

            // Send WebSocket notification
            webSocketService.notifyUploadComplete(
                    command.userId(),
                    command.photoId(),
                    photo.getFileName());

            // Create and return response
            LocalDateTime uploadedAt = savedPhoto.getUploadedAt();
            Instant uploadedAtInstant = uploadedAt != null 
                    ? uploadedAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                    : Instant.now();

            PhotoCompletionResponse response = new PhotoCompletionResponse(
                    command.photoId().value().toString(),
                    savedPhoto.getStatus(),
                    uploadedAtInstant,
                    "Photo upload completed successfully"
            );

            log.info("Photo completion processed successfully: photoId={}", command.photoId().value());
            return response;

        } catch (PhotoNotFoundException e) {
            log.error("Photo not found error: {}", e.getMessage());
            throw e;
        } catch (S3VerificationException e) {
            log.error("S3 verification error: {}", e.getMessage());
            throw e;
        } catch (IllegalStateException e) {
            log.error("Invalid state transition error: {}", e.getMessage());
            throw e;
        } catch (S3UploadException e) {
            log.error("S3 service error during photo completion: {}", e.getMessage(), e);
            throw new S3VerificationException("S3 upload verification failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during photo completion: photoId={}, userId={}",
                     command.photoId().value(), command.userId().value(), e);
            throw new RuntimeException("Failed to complete photo upload: " + e.getMessage(), e);
        }
    }
}

