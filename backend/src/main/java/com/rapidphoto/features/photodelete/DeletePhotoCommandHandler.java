package com.rapidphoto.features.photodelete;

import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.infrastructure.s3.S3Service;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Command handler for photo deletion operations.
 * Deletes photo from both S3 and database.
 */
@Service
public class DeletePhotoCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(DeletePhotoCommandHandler.class);

    private final PhotoRepository photoRepository;
    private final S3Service s3Service;

    public DeletePhotoCommandHandler(
            PhotoRepository photoRepository,
            S3Service s3Service) {
        this.photoRepository = photoRepository;
        this.s3Service = s3Service;
    }

    @Transactional
    public void handle(DeletePhotoCommand command) {
        log.info("Processing photo deletion: photoId={}, userId={}",
                 command.photoId().value(), command.userId().value());

        try {
            // Find photo by ID and userId for authorization check
            Optional<Photo> photoOpt = photoRepository.findByIdAndUserId(
                    command.photoId(), 
                    command.userId());

            if (photoOpt.isEmpty()) {
                log.warn("Photo not found or does not belong to user: photoId={}, userId={}", 
                        command.photoId().value(), command.userId().value());
                throw new PhotoNotFoundException(
                    String.format("Photo not found for photoId=%s", command.photoId().value()));
            }

            Photo photo = photoOpt.get();

            // Attempt to delete from S3 if s3Key exists
            String s3Key = photo.getS3Key();
            if (s3Key != null && !s3Key.isBlank()) {
                try {
                    s3Service.deleteObject(s3Key);
                } catch (S3UploadException e) {
                    // S3Service already handles NoSuchKeyException gracefully
                    // If we get here, it's a different S3 error
                    log.error("S3 deletion failed for photo: photoId={}, s3Key={}, error={}. Continuing with database deletion.",
                            command.photoId().value(), s3Key, e.getMessage(), e);
                    // Continue with database deletion even if S3 deletion fails (fallback strategy)
                }
            } else {
                log.debug("No S3 key found for photo: photoId={}. Skipping S3 deletion.", command.photoId().value());
            }

            // Delete photo from database
            photoRepository.delete(photo);
            log.info("Successfully deleted photo: photoId={}, fileName={}", 
                    command.photoId().value(), photo.getFileName());

        } catch (PhotoNotFoundException e) {
            log.error("Photo not found error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during photo deletion: photoId={}, userId={}",
                     command.photoId().value(), command.userId().value(), e);
            throw new RuntimeException("Failed to delete photo: " + e.getMessage(), e);
        }
    }
}

