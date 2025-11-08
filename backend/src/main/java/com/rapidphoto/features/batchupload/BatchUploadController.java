package com.rapidphoto.features.batchupload;

import com.rapidphoto.domain.UserId;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for batch photo upload operations.
 * CORS is configured globally via CorsConfig, so @CrossOrigin is not needed here.
 */
@RestController
@RequestMapping("/api/photos")
public class BatchUploadController {

    private static final Logger log = LoggerFactory.getLogger(BatchUploadController.class);

    private final BatchUploadCommandHandler commandHandler;

    public BatchUploadController(BatchUploadCommandHandler commandHandler) {
        this.commandHandler = commandHandler;
    }

    @PostMapping("/batch-init")
    public ResponseEntity<BatchUploadResponse> initiateBatchUpload(
            @RequestParam String userId,
            @Valid @RequestBody InitiateBatchUploadRequest request) {
        
        log.info("Received batch upload request for userId: {}, photoCount: {}", 
                 userId, request.photos().size());

        try {
            // Convert String userId to UserId object
            UserId userIdObj = UserId.fromString(userId);

            // Create command
            InitiateBatchUploadCommand command = new InitiateBatchUploadCommand(
                userIdObj,
                request.photos()
            );

            // Handle command
            BatchUploadResponse response = commandHandler.handle(command);

            log.info("Batch upload initiated successfully for userId: {}, totalCount: {}", 
                     userId, response.totalCount());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid userId format: {}", userId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (S3UploadException e) {
            log.error("S3 error during batch upload for userId: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error during batch upload for userId: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    @ExceptionHandler(S3UploadException.class)
    public ResponseEntity<Map<String, String>> handleS3UploadException(S3UploadException ex) {
        log.error("S3 upload exception: {}", ex.getMessage(), ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Failed to generate presigned upload URLs: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "An unexpected error occurred: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Request DTO for batch upload endpoint.
     * Separated from command to allow userId to come from @RequestParam.
     */
    public record InitiateBatchUploadRequest(
        @jakarta.validation.constraints.NotEmpty(message = "Photos list cannot be empty")
        @jakarta.validation.constraints.Size(max = 100, message = "Maximum 100 photos allowed per batch")
        @jakarta.validation.Valid
        java.util.List<PhotoMetadata> photos
    ) {
    }
}

