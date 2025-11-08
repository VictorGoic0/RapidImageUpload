# RapidPhotoUpload Tasks - Part 3: Photo Query Feature & Backend Testing

## PR #8: Photo Query Feature (Query Side - CQRS)

### Photo Query DTOs
- [ ] 1. Create `features/photoquery/GetPhotosQuery.java` record
- [ ] 2. Add field: @NotNull UserId userId
- [ ] 3. Add field: @Min(0) Integer page (default 0)
- [ ] 4. Add field: @Min(1) @Max(100) Integer size (default 20)
- [ ] 5. Add validation annotations
- [ ] 6. Create `features/photoquery/PhotoDto.java` record
- [ ] 7. Add field: String photoId
- [ ] 8. Add field: String fileName
- [ ] 9. Add field: UploadStatus status
- [ ] 10. Add field: Long fileSize
- [ ] 11. Add field: String contentType
- [ ] 12. Add field: Instant createdAt
- [ ] 13. Add field: Instant uploadedAt (nullable)
- [ ] 14. Add field: String downloadUrl (nullable)
- [ ] 15. Add static factory method `fromDomain(Photo photo, String downloadUrl)`
- [ ] 16. Create `features/photoquery/PhotoQueryResponse.java` record
- [ ] 17. Add field: List<PhotoDto> photos
- [ ] 18. Add field: Integer currentPage
- [ ] 19. Add field: Integer totalPages
- [ ] 20. Add field: Long totalElements
- [ ] 21. Add field: Integer pageSize

### Photo Query Handler
- [ ] 22. Create `features/photoquery/PhotoQueryHandler.java` with @Service
- [ ] 23. Inject PhotoRepository via constructor
- [ ] 24. Inject S3Service via constructor
- [ ] 25. Add SLF4J logger
- [ ] 26. Create method `handle(GetPhotosQuery query)` returning PhotoQueryResponse
- [ ] 27. Create Pageable object from query.page() and query.size()
- [ ] 28. Add sort by createdAt descending
- [ ] 29. Call `photoRepository.findByUserId(userId, pageable)`
- [ ] 30. Get Page<Photo> result
- [ ] 31. For each photo, generate download URL if status is COMPLETED
- [ ] 32. Map Photo entities to PhotoDto using fromDomain()
- [ ] 33. Create PhotoQueryResponse with photos list and pagination info
- [ ] 34. Return response
- [ ] 35. Add error handling for repository failures
- [ ] 36. Add logging for query execution
- [ ] 37. Optimize N+1 query problem if needed (batch URL generation)

### Get Photo By ID Query
- [ ] 38. Create `features/photoquery/GetPhotoByIdQuery.java` record
- [ ] 39. Add field: @NotNull PhotoId photoId
- [ ] 40. Add field: @NotNull UserId userId
- [ ] 41. Add method to PhotoQueryHandler: `handleGetById(GetPhotoByIdQuery query)`
- [ ] 42. Call `photoRepository.findByIdAndUserId(photoId, userId)`
- [ ] 43. Throw exception if photo not found
- [ ] 44. Generate download URL if photo is COMPLETED
- [ ] 45. Map to PhotoDto and return
- [ ] 46. Add error handling

### Photo Query REST Controller
- [ ] 47. Create `features/photoquery/PhotoQueryController.java` with @RestController
- [ ] 48. Add @RequestMapping("/api/photos")
- [ ] 49. Add @CrossOrigin annotation
- [ ] 50. Inject PhotoQueryHandler via constructor
- [ ] 51. Add SLF4J logger
- [ ] 52. Create @GetMapping endpoint (no path)
- [ ] 53. Accept @RequestParam String userId (mock auth)
- [ ] 54. Accept @RequestParam(defaultValue="0") Integer page
- [ ] 55. Accept @RequestParam(defaultValue="20") Integer size
- [ ] 56. Convert String userId to UserId object
- [ ] 57. Create GetPhotosQuery
- [ ] 58. Call queryHandler.handle(query)
- [ ] 59. Return ResponseEntity.ok(response)
- [ ] 60. Create @GetMapping("/{photoId}") endpoint
- [ ] 61. Accept @PathVariable String photoId
- [ ] 62. Accept @RequestParam String userId
- [ ] 63. Convert parameters to domain objects
- [ ] 64. Create GetPhotoByIdQuery
- [ ] 65. Call queryHandler.handleGetById(query)
- [ ] 66. Return ResponseEntity.ok(photoDto)
- [ ] 67. Add @ExceptionHandler for PhotoNotFoundException
- [ ] 68. Return 404 status for not found photos

---

## PR #9: Backend Integration Tests

### Test Configuration
- [ ] 1. Create `src/test/resources/application-test.yml`
- [ ] 2. Configure H2 in-memory database for tests
- [ ] 3. Set JPA ddl-auto to create-drop for tests
- [ ] 4. Configure test server port (random)
- [ ] 5. Add test logging configuration
- [ ] 6. Create `src/test/java/com/rapidphoto/config/TestConfig.java`
- [ ] 7. Add @TestConfiguration annotation
- [ ] 8. Create @Bean for mock S3Service
- [ ] 9. Configure Mockito mocks for AWS dependencies

### Batch Upload Integration Tests
- [ ] 10. Create `features/batchupload/BatchUploadIntegrationTest.java`
- [ ] 11. Add @SpringBootTest annotation
- [ ] 12. Add @AutoConfigureMockMvc annotation
- [ ] 13. Inject MockMvc
- [ ] 14. Inject ObjectMapper for JSON serialization
- [ ] 15. Inject PhotoRepository for verification
- [ ] 16. Mock S3Service using @MockBean
- [ ] 17. Create test: `shouldInitiateBatchUpload()`
- [ ] 18. Mock S3Service.generatePresignedUploadUrl() to return test URL
- [ ] 19. Create InitiateBatchUploadCommand with 2 photos
- [ ] 20. Perform POST /api/photos/batch-init with MockMvc
- [ ] 21. Assert response status is 201 CREATED
- [ ] 22. Assert response contains 2 uploads
- [ ] 23. Assert each upload has photoId, presignedUrl, s3Key, expiresAt
- [ ] 24. Verify photoRepository.findAll() returns 2 photos
- [ ] 25. Verify all photos have status PENDING
- [ ] 26. Create test: `shouldRejectEmptyPhotoList()`
- [ ] 27. Send request with empty photos array
- [ ] 28. Assert 400 BAD REQUEST status
- [ ] 29. Create test: `shouldRejectMoreThan100Photos()`
- [ ] 30. Send request with 101 photos
- [ ] 31. Assert 400 BAD REQUEST status
- [ ] 32. Create test: `shouldHandleS3ServiceFailure()`
- [ ] 33. Mock S3Service to throw exception
- [ ] 34. Assert 500 INTERNAL SERVER ERROR status
- [ ] 35. Verify transaction rollback (no photos saved)

### Photo Completion Integration Tests
- [ ] 36. Create `features/photocompletion/PhotoCompletionIntegrationTest.java`
- [ ] 37. Add @SpringBootTest and @AutoConfigureMockMvc
- [ ] 38. Inject MockMvc, PhotoRepository
- [ ] 39. Mock S3Service using @MockBean
- [ ] 40. Create test: `shouldCompletePhotoUpload()`
- [ ] 41. Create and save a PENDING photo to repository
- [ ] 42. Mock S3Service.verifyObjectExists() to return true
- [ ] 43. Perform POST /api/photos/{photoId}/complete
- [ ] 44. Assert response status is 200 OK
- [ ] 45. Assert response status is COMPLETED
- [ ] 46. Verify photo in database has status COMPLETED
- [ ] 47. Verify photo.uploadedAt is not null
- [ ] 48. Verify photo.s3Key is set correctly
- [ ] 49. Create test: `shouldReturn404ForNonExistentPhoto()`
- [ ] 50. Try to complete photo that doesn't exist
- [ ] 51. Assert 404 NOT FOUND status
- [ ] 52. Create test: `shouldFailIfS3ObjectNotFound()`
- [ ] 53. Mock S3Service.verifyObjectExists() to return false
- [ ] 54. Assert 400 BAD REQUEST or 500 status
- [ ] 55. Verify photo status remains PENDING
- [ ] 56. Create test: `shouldRejectCompletingAlreadyCompletedPhoto()`
- [ ] 57. Create and save a COMPLETED photo
- [ ] 58. Try to complete it again
- [ ] 59. Assert 400 BAD REQUEST status
- [ ] 60. Verify IllegalStateException is thrown

### Photo Query Integration Tests
- [ ] 61. Create `features/photoquery/PhotoQueryIntegrationTest.java`
- [ ] 62. Add @SpringBootTest and @AutoConfigureMockMvc
- [ ] 63. Inject MockMvc, PhotoRepository
- [ ] 64. Mock S3Service for download URL generation
- [ ] 65. Create test: `shouldReturnUserPhotos()`
- [ ] 66. Create and save 5 photos for test user
- [ ] 67. Perform GET /api/photos?userId={userId}
- [ ] 68. Assert response status is 200 OK
- [ ] 69. Assert response contains 5 photos
- [ ] 70. Assert pagination info is correct (page, totalPages, totalElements)
- [ ] 71. Verify photos are sorted by createdAt descending
- [ ] 72. Create test: `shouldReturnEmptyListForUserWithNoPhotos()`
- [ ] 73. Perform GET with userId that has no photos
- [ ] 74. Assert response contains empty array
- [ ] 75. Assert totalElements is 0
- [ ] 76. Create test: `shouldPaginatePhotos()`
- [ ] 77. Create and save 25 photos
- [ ] 78. Request page 0 with size 10
- [ ] 79. Assert 10 photos returned
- [ ] 80. Request page 1 with size 10
- [ ] 81. Assert next 10 photos returned
- [ ] 82. Create test: `shouldGetPhotoById()`
- [ ] 83. Create and save a photo
- [ ] 84. Perform GET /api/photos/{photoId}?userId={userId}
- [ ] 85. Assert correct photo returned
- [ ] 86. Assert download URL present if COMPLETED
- [ ] 87. Create test: `shouldReturn404ForNonExistentPhotoId()`
- [ ] 88. Request photo that doesn't exist
- [ ] 89. Assert 404 NOT FOUND status

### WebSocket Integration Tests (Optional)
- [ ] 90. Create `infrastructure/websocket/WebSocketIntegrationTest.java`
- [ ] 91. Add @SpringBootTest with webEnvironment = RANDOM_PORT
- [ ] 92. Inject @LocalServerPort
- [ ] 93. Create WebSocket STOMP client for testing
- [ ] 94. Create test: `shouldConnectToWebSocket()`
- [ ] 95. Connect to ws://localhost:{port}/ws
- [ ] 96. Assert connection successful
- [ ] 97. Create test: `shouldReceiveProgressUpdates()`
- [ ] 98. Connect and subscribe to /user/queue/progress
- [ ] 99. Send progress update via /app/upload-progress
- [ ] 100. Assert message received on subscription
- [ ] 101. Verify message contains correct photoId and progress