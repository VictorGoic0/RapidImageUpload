package com.rapidphoto.features.photocompletion;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for photo completion operations.
 * CORS is configured globally via CorsConfig, so @CrossOrigin is not needed here.
 */
@RestController
@RequestMapping("/api/photos")
public class PhotoCompletionController {

    private static final Logger log = LoggerFactory.getLogger(PhotoCompletionController.class);

    private final PhotoCompletionCommandHandler commandHandler;

    public PhotoCompletionController(PhotoCompletionCommandHandler commandHandler) {
        this.commandHandler = commandHandler;
    }

    @PostMapping("/{photoId}/complete")
    public ResponseEntity<?> completePhotoUpload(
            @PathVariable String photoId,
            @RequestParam String userId,
            @Valid @RequestBody CompletePhotoRequest request) {

        log.info("Received photo completion request: photoId={}, userId={}, s3Key={}",
                 photoId, userId, request.s3Key());

        try {
            // Convert String photoId to PhotoId object
            PhotoId photoIdObj = PhotoId.fromString(photoId);

            // Convert String userId to UserId object
            UserId userIdObj = UserId.fromString(userId);

            // Create command
            CompletePhotoUploadCommand command = new CompletePhotoUploadCommand(
                    photoIdObj,
                    userIdObj,
                    request.s3Key()
            );

            // Handle command
            PhotoCompletionResponse response = commandHandler.handle(command);

            log.info("Photo completion successful: photoId={}, status={}", 
                     photoId, response.status());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format: photoId={}, userId={}, error={}", 
                     photoId, userId, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid UUID format: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (PhotoNotFoundException e) {
            log.warn("Photo not found: photoId={}, userId={}", photoId, userId);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (S3VerificationException e) {
            log.error("S3 verification failed: photoId={}, error={}", photoId, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalStateException e) {
            log.error("Invalid state transition: photoId={}, error={}", photoId, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid photo state: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Unexpected error during photo completion: photoId={}, userId={}", 
                     photoId, userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    /**
     * Request DTO for photo completion endpoint.
     */
    public record CompletePhotoRequest(
        @NotBlank(message = "S3 key cannot be blank")
        String s3Key
    ) {
    }
}

