# RapidPhotoUpload Tasks - Part 2: WebSocket & Batch Upload Feature

## PR #5: WebSocket Configuration & Infrastructure

### WebSocket Configuration
- [ ] 1. Create `config/WebSocketConfig.java` class with @Configuration
- [ ] 2. Add @EnableWebSocketMessageBroker annotation
- [ ] 3. Implement WebSocketMessageBrokerConfigurer interface
- [ ] 4. Override `configureMessageBroker()` method
- [ ] 5. Enable simple broker with destinations: "/topic", "/queue"
- [ ] 6. Set application destination prefix: "/app"
- [ ] 7. Set user destination prefix: "/user"
- [ ] 8. Override `registerStompEndpoints()` method
- [ ] 9. Register STOMP endpoint: "/ws"
- [ ] 10. Configure allowed origins for development: "http://localhost:5173", "http://localhost:8080"
- [ ] 11. Add withSockJS() for fallback support
- [ ] 12. Configure CORS for WebSocket endpoints
- [ ] 13. Add session timeout configuration (optional)
- [ ] 14. Add heartbeat configuration for connection monitoring

### WebSocket DTOs
- [ ] 15. Create `infrastructure/websocket/PhotoProgress.java` record
- [ ] 16. Add field: String photoId
- [ ] 17. Add field: String fileName
- [ ] 18. Add field: UploadStatus status
- [ ] 19. Add field: Integer progressPercentage (0-100)
- [ ] 20. Add field: String message
- [ ] 21. Add field: Instant timestamp
- [ ] 22. Add static factory method `PhotoProgress.uploading()`
- [ ] 23. Add static factory method `PhotoProgress.completed()`
- [ ] 24. Add static factory method `PhotoProgress.failed()`

### WebSocket Service
- [ ] 25. Create `infrastructure/websocket/WebSocketProgressService.java` with @Service
- [ ] 26. Inject SimpMessagingTemplate via constructor
- [ ] 27. Add SLF4J logger
- [ ] 28. Create method `sendProgressToUser(UserId userId, PhotoProgress progress)`
- [ ] 29. Implement convertAndSendToUser() to send to "/queue/progress"
- [ ] 30. Add error handling for WebSocket send failures
- [ ] 31. Add logging for all WebSocket messages sent
- [ ] 32. Create method `broadcastProgress(PhotoProgress progress)` for topic broadcasting
- [ ] 33. Implement convertAndSend() to broadcast to "/topic/progress"
- [ ] 34. Add method `notifyUploadComplete(UserId userId, PhotoId photoId, String fileName)`
- [ ] 35. Create PhotoProgress.completed() and send via WebSocket
- [ ] 36. Add method `notifyUploadFailed(UserId userId, PhotoId photoId, String fileName, String error)`
- [ ] 37. Create PhotoProgress.failed() and send via WebSocket

### WebSocket Controller
- [ ] 38. Create `infrastructure/websocket/UploadProgressController.java` with @Controller
- [ ] 39. Inject WebSocketProgressService
- [ ] 40. Add @MessageMapping("/upload-progress") method
- [ ] 41. Accept @Payload PhotoProgress parameter
- [ ] 42. Accept Principal parameter for user identification
- [ ] 43. Log received progress updates
- [ ] 44. Extract UserId from Principal (use mock for MVP: hardcoded userId)
- [ ] 45. Call WebSocketProgressService to broadcast progress
- [ ] 46. Add validation for progress percentage (0-100)
- [ ] 47. Add error handling for invalid messages
- [ ] 48. Add @SendTo annotation for response routing (optional)

---

## PR #6: Batch Upload Feature (Command Side - CQRS)

### Batch Upload DTOs
- [ ] 1. Create `features/batchupload/PhotoMetadata.java` record
- [ ] 2. Add field: @NotBlank String fileName
- [ ] 3. Add field: @NotBlank String contentType
- [ ] 4. Add field: @Positive Long size
- [ ] 5. Add validation annotations
- [ ] 6. Create `features/batchupload/InitiateBatchUploadCommand.java` record
- [ ] 7. Add field: @NotNull UserId userId
- [ ] 8. Add field: @NotEmpty @Size(max=100) List<PhotoMetadata> photos
- [ ] 9. Add validation for max 100 photos
- [ ] 10. Create `features/batchupload/PresignedUploadInfo.java` record
- [ ] 11. Add field: String photoId (UUID as string)
- [ ] 12. Add field: String fileName
- [ ] 13. Add field: String presignedUrl
- [ ] 14. Add field: String s3Key
- [ ] 15. Add field: Instant expiresAt
- [ ] 16. Create `features/batchupload/BatchUploadResponse.java` record
- [ ] 17. Add field: List<PresignedUploadInfo> uploads
- [ ] 18. Add field: Integer totalCount
- [ ] 19. Add field: Instant requestedAt

### Batch Upload Command Handler
- [ ] 20. Create `features/batchupload/BatchUploadCommandHandler.java` with @Service
- [ ] 21. Inject PhotoRepository via constructor
- [ ] 22. Inject S3Service via constructor
- [ ] 23. Add SLF4J logger
- [ ] 24. Create @Transactional method `handle(InitiateBatchUploadCommand command)`
- [ ] 25. Log start of batch upload with photo count
- [ ] 26. Create List<Photo> from command.photos() using Photo.createPending()
- [ ] 27. Generate PhotoId for each photo
- [ ] 28. Set userId, fileName, fileSize, contentType for each photo
- [ ] 29. Save all photos to database: `photoRepository.saveAll(photos)`
- [ ] 30. Log successful database save
- [ ] 31. Generate S3 keys for each photo using S3Service.generateS3Key()
- [ ] 32. Generate presigned upload URLs for each photo
- [ ] 33. Create PresignedUploadInfo for each photo with URL, key, expiration
- [ ] 34. Create and return BatchUploadResponse with all upload info
- [ ] 35. Add error handling for database failures
- [ ] 36. Add error handling for S3 service failures
- [ ] 37. Ensure transaction rollback on any failure
- [ ] 38. Add performance logging (measure time taken)

### Batch Upload REST Controller
- [ ] 39. Create `features/batchupload/BatchUploadController.java` with @RestController
- [ ] 40. Add @RequestMapping("/api/photos")
- [ ] 41. Add @CrossOrigin annotation for CORS (dev: localhost:5173)
- [ ] 42. Inject BatchUploadCommandHandler via constructor
- [ ] 43. Add SLF4J logger
- [ ] 44. Create @PostMapping("/batch-init") endpoint
- [ ] 45. Accept @Valid @RequestBody InitiateBatchUploadCommand
- [ ] 46. Add @RequestParam for userId (mock auth: hardcoded UUID for MVP)
- [ ] 47. Create command object with userId and photo metadata
- [ ] 48. Call commandHandler.handle(command)
- [ ] 49. Return ResponseEntity.status(CREATED).body(response)
- [ ] 50. Add @ExceptionHandler for validation errors
- [ ] 51. Add @ExceptionHandler for S3UploadException
- [ ] 52. Add @ExceptionHandler for general exceptions
- [ ] 53. Return proper error responses with status codes
- [ ] 54. Add request/response logging

---

## PR #7: Photo Completion Feature (Command Side - CQRS)

### Photo Completion DTOs
- [ ] 1. Create `features/photocompletion/CompletePhotoUploadCommand.java` record
- [ ] 2. Add field: @NotNull PhotoId photoId
- [ ] 3. Add field: @NotNull UserId userId
- [ ] 4. Add field: @NotBlank String s3Key
- [ ] 5. Add validation annotations
- [ ] 6. Create `features/photocompletion/PhotoCompletionResponse.java` record
- [ ] 7. Add field: String photoId
- [ ] 8. Add field: UploadStatus status
- [ ] 9. Add field: Instant uploadedAt
- [ ] 10. Add field: String message

### Photo Completion Command Handler
- [ ] 11. Create `features/photocompletion/PhotoCompletionCommandHandler.java` with @Service
- [ ] 12. Inject PhotoRepository via constructor
- [ ] 13. Inject S3Service via constructor
- [ ] 14. Inject WebSocketProgressService via constructor
- [ ] 15. Add SLF4J logger
- [ ] 16. Create @Transactional method `handle(CompletePhotoUploadCommand command)`
- [ ] 17. Find photo by ID and userId: `photoRepository.findByIdAndUserId()`
- [ ] 18. Throw exception if photo not found: "Photo not found"
- [ ] 19. Verify S3 object exists using S3Service.verifyObjectExists()
- [ ] 20. Throw exception if S3 object doesn't exist: "S3 upload verification failed"
- [ ] 21. Call photo.markAsCompleted(s3Key) domain method
- [ ] 22. Save updated photo to database
- [ ] 23. Log successful completion
- [ ] 24. Send WebSocket notification: webSocketService.notifyUploadComplete()
- [ ] 25. Create and return PhotoCompletionResponse
- [ ] 26. Add error handling for photo not found
- [ ] 27. Add error handling for S3 verification failure
- [ ] 28. Add error handling for invalid state transitions
- [ ] 29. Ensure transaction rollback on failures

### Photo Completion REST Controller
- [ ] 30. Create `features/photocompletion/PhotoCompletionController.java` with @RestController
- [ ] 31. Add @RequestMapping("/api/photos")
- [ ] 32. Add @CrossOrigin annotation
- [ ] 33. Inject PhotoCompletionCommandHandler via constructor
- [ ] 34. Add SLF4J logger
- [ ] 35. Create @PostMapping("/{photoId}/complete") endpoint
- [ ] 36. Accept @PathVariable String photoId (convert to PhotoId)
- [ ] 37. Accept @RequestParam String userId (mock auth)
- [ ] 38. Accept @Valid @RequestBody CompletePhotoRequest (with s3Key)
- [ ] 39. Create CompletePhotoRequest record with @NotBlank String s3Key field
- [ ] 40. Convert String photoId to PhotoId object
- [ ] 41. Convert String userId to UserId object
- [ ] 42. Create CompletePhotoUploadCommand
- [ ] 43. Call commandHandler.handle(command)
- [ ] 44. Return ResponseEntity.ok(response)
- [ ] 45. Add @ExceptionHandler for PhotoNotFoundException
- [ ] 46. Add @ExceptionHandler for S3VerificationException
- [ ] 47. Add @ExceptionHandler for IllegalStateException (invalid transitions)
- [ ] 48. Return appropriate HTTP status codes (404, 400, 500)