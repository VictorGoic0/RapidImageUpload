package com.rapidphoto.features.photodelete;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for photo deletion operations.
 * CORS is configured globally via CorsConfig, so @CrossOrigin is not needed here.
 */
@RestController
@RequestMapping("/api/photos")
public class DeletePhotoController {

    private static final Logger log = LoggerFactory.getLogger(DeletePhotoController.class);
    
    // Mock userId for MVP (will be replaced with authentication in PR #26)
    private static final UserId MOCK_USER_ID = new UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"));

    private final DeletePhotoCommandHandler commandHandler;

    public DeletePhotoController(DeletePhotoCommandHandler commandHandler) {
        this.commandHandler = commandHandler;
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<?> deletePhoto(@PathVariable String photoId) {
        log.info("Received photo deletion request: photoId={}", photoId);

        try {
            // Convert String photoId to PhotoId object
            PhotoId photoIdObj = PhotoId.fromString(photoId);

            // Create DeletePhotoCommand with mock userId for MVP
            DeletePhotoCommand command = new DeletePhotoCommand(
                    photoIdObj,
                    MOCK_USER_ID
            );

            // Handle command
            commandHandler.handle(command);

            log.info("Photo deletion successful: photoId={}", photoId);
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format: photoId={}, error={}", photoId, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid UUID format: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (PhotoNotFoundException e) {
            log.warn("Photo not found: photoId={}", photoId);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("Unexpected error during photo deletion: photoId={}", photoId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

