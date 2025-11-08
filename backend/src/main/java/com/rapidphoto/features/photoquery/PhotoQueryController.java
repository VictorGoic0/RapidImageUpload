package com.rapidphoto.features.photoquery;

import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.UserId;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for photo query operations.
 * CORS is configured globally via CorsConfig, so @CrossOrigin is not needed here.
 */
@RestController
@RequestMapping("/api/photos")
public class PhotoQueryController {

    private static final Logger log = LoggerFactory.getLogger(PhotoQueryController.class);

    private final PhotoQueryHandler queryHandler;

    public PhotoQueryController(PhotoQueryHandler queryHandler) {
        this.queryHandler = queryHandler;
    }

    /**
     * GET endpoint to retrieve paginated photos for a user.
     * 
     * @param userId The user ID (mock auth)
     * @param page The page number (default: 0)
     * @param size The page size (default: 20)
     * @return ResponseEntity with PhotoQueryResponse
     */
    @GetMapping
    public ResponseEntity<?> getPhotos(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        log.info("Received get photos request: userId={}, page={}, size={}", userId, page, size);

        try {
            // Convert String userId to UserId object
            UserId userIdObj = UserId.fromString(userId);

            // Create query
            GetPhotosQuery query = new GetPhotosQuery(userIdObj, page, size);

            // Handle query
            PhotoQueryResponse response = queryHandler.handle(query);

            log.info("Get photos request completed: userId={}, returned={}, total={}",
                    userId, response.photos().size(), response.totalElements());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid userId format: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid userId format: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Unexpected error during get photos: userId={}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * GET endpoint to retrieve a single photo by ID.
     * 
     * @param photoId The photo ID
     * @param userId The user ID (mock auth)
     * @return ResponseEntity with PhotoDto
     */
    @GetMapping("/{photoId}")
    public ResponseEntity<?> getPhotoById(
            @PathVariable String photoId,
            @RequestParam String userId) {

        log.info("Received get photo by ID request: photoId={}, userId={}", photoId, userId);

        try {
            // Convert parameters to domain objects
            PhotoId photoIdObj = PhotoId.fromString(photoId);
            UserId userIdObj = UserId.fromString(userId);

            // Create query
            GetPhotoByIdQuery query = new GetPhotoByIdQuery(photoIdObj, userIdObj);

            // Handle query
            PhotoDto photoDto = queryHandler.handleGetById(query);

            log.info("Get photo by ID request completed: photoId={}, status={}",
                    photoId, photoDto.status());

            return ResponseEntity.ok(photoDto);

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
        } catch (Exception e) {
            log.error("Unexpected error during get photo by ID: photoId={}, userId={}",
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
}

