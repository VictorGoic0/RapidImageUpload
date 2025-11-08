# RapidPhotoUpload Tasks - Part 2: WebSocket & Batch Upload Feature

## PR #5: WebSocket Configuration & Infrastructure

### WebSocket Configuration
- [x] 1. Create `config/WebSocketConfig.java` class with @Configuration
- [x] 2. Add @EnableWebSocketMessageBroker annotation
- [x] 3. Implement WebSocketMessageBrokerConfigurer interface
- [x] 4. Override `configureMessageBroker()` method
- [x] 5. Enable simple broker with destinations: "/topic", "/queue"
- [x] 6. Set application destination prefix: "/app"
- [x] 7. Set user destination prefix: "/user"
- [x] 8. Override `registerStompEndpoints()` method
- [x] 9. Register STOMP endpoint: "/ws"
- [x] 10. Configure allowed origins for development: "http://localhost:5173", "http://localhost:8080"
- [x] 11. Add withSockJS() for fallback support
- [x] 12. Configure CORS for WebSocket endpoints
- [x] 13. Add session timeout configuration (optional)
- [x] 14. Add heartbeat configuration for connection monitoring

### WebSocket DTOs
- [x] 15. Create `infrastructure/websocket/PhotoProgress.java` record
- [x] 16. Add field: String photoId
- [x] 17. Add field: String fileName
- [x] 18. Add field: UploadStatus status
- [x] 19. Add field: Integer progressPercentage (0-100)
- [x] 20. Add field: String message
- [x] 21. Add field: Instant timestamp
- [x] 22. Add static factory method `PhotoProgress.uploading()`
- [x] 23. Add static factory method `PhotoProgress.completed()`
- [x] 24. Add static factory method `PhotoProgress.failed()`

### WebSocket Service
- [x] 25. Create `infrastructure/websocket/WebSocketProgressService.java` with @Service
- [x] 26. Inject SimpMessagingTemplate via constructor
- [x] 27. Add SLF4J logger
- [x] 28. Create method `sendProgressToUser(UserId userId, PhotoProgress progress)`
- [x] 29. Implement convertAndSendToUser() to send to "/queue/progress"
- [x] 30. Add error handling for WebSocket send failures
- [x] 31. Add logging for all WebSocket messages sent
- [x] 32. Create method `broadcastProgress(PhotoProgress progress)` for topic broadcasting
- [x] 33. Implement convertAndSend() to broadcast to "/topic/progress"
- [x] 34. Add method `notifyUploadComplete(UserId userId, PhotoId photoId, String fileName)`
- [x] 35. Create PhotoProgress.completed() and send via WebSocket
- [x] 36. Add method `notifyUploadFailed(UserId userId, PhotoId photoId, String fileName, String error)`
- [x] 37. Create PhotoProgress.failed() and send via WebSocket

### WebSocket Controller
- [x] 38. Create `infrastructure/websocket/UploadProgressController.java` with @Controller
- [x] 39. Inject WebSocketProgressService
- [x] 40. Add @MessageMapping("/upload-progress") method
- [x] 41. Accept @Payload PhotoProgress parameter
- [x] 42. Accept Principal parameter for user identification
- [x] 43. Log received progress updates
- [x] 44. Extract UserId from Principal (use mock for MVP: hardcoded userId)
- [x] 45. Call WebSocketProgressService to broadcast progress
- [x] 46. Add validation for progress percentage (0-100)
- [x] 47. Add error handling for invalid messages
- [x] 48. Add @SendTo annotation for response routing (optional)

---

## PR #6: Batch Upload Feature (Command Side - CQRS)

### Batch Upload DTOs
- [x] 1. Create `features/batchupload/PhotoMetadata.java` record
- [x] 2. Add field: @NotBlank String fileName
- [x] 3. Add field: @NotBlank String contentType
- [x] 4. Add field: @Positive Long size
- [x] 5. Add validation annotations
- [x] 6. Create `features/batchupload/InitiateBatchUploadCommand.java` record
- [x] 7. Add field: @NotNull UserId userId
- [x] 8. Add field: @NotEmpty @Size(max=100) List<PhotoMetadata> photos
- [x] 9. Add validation for max 100 photos
- [x] 10. Create `features/batchupload/PresignedUploadInfo.java` record
- [x] 11. Add field: String photoId (UUID as string)
- [x] 12. Add field: String fileName
- [x] 13. Add field: String presignedUrl
- [x] 14. Add field: String s3Key
- [x] 15. Add field: Instant expiresAt
- [x] 16. Create `features/batchupload/BatchUploadResponse.java` record
- [x] 17. Add field: List<PresignedUploadInfo> uploads
- [x] 18. Add field: Integer totalCount
- [x] 19. Add field: Instant requestedAt

### Batch Upload Command Handler
- [x] 20. Create `features/batchupload/BatchUploadCommandHandler.java` with @Service
- [x] 21. Inject PhotoRepository via constructor
- [x] 22. Inject S3Service via constructor
- [x] 23. Add SLF4J logger
- [x] 24. Create @Transactional method `handle(InitiateBatchUploadCommand command)`
- [x] 25. Log start of batch upload with photo count
- [x] 26. Create List<Photo> from command.photos() using Photo.createPending()
- [x] 27. Generate PhotoId for each photo
- [x] 28. Set userId, fileName, fileSize, contentType for each photo
- [x] 29. Save all photos to database: `photoRepository.saveAll(photos)`
- [x] 30. Log successful database save
- [x] 31. Generate S3 keys for each photo using S3Service.generateS3Key()
- [x] 32. Generate presigned upload URLs for each photo
- [x] 33. Create PresignedUploadInfo for each photo with URL, key, expiration
- [x] 34. Create and return BatchUploadResponse with all upload info
- [x] 35. Add error handling for database failures
- [x] 36. Add error handling for S3 service failures
- [x] 37. Ensure transaction rollback on any failure
- [x] 38. Add performance logging (measure time taken)

### Batch Upload REST Controller
- [x] 39. Create `features/batchupload/BatchUploadController.java` with @RestController
- [x] 40. Add @RequestMapping("/api/photos")
- [x] 41. Add @CrossOrigin annotation for CORS (dev: localhost:5173)
- [x] 42. Inject BatchUploadCommandHandler via constructor
- [x] 43. Add SLF4J logger
- [x] 44. Create @PostMapping("/batch-init") endpoint
- [x] 45. Accept @Valid @RequestBody InitiateBatchUploadCommand
- [x] 46. Add @RequestParam for userId (mock auth: hardcoded UUID for MVP)
- [x] 47. Create command object with userId and photo metadata
- [x] 48. Call commandHandler.handle(command)
- [x] 49. Return ResponseEntity.status(CREATED).body(response)
- [x] 50. Add @ExceptionHandler for validation errors
- [x] 51. Add @ExceptionHandler for S3UploadException
- [x] 52. Add @ExceptionHandler for general exceptions
- [x] 53. Return proper error responses with status codes
- [x] 54. Add request/response logging

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