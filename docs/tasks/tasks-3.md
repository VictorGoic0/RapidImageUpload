# RapidPhotoUpload Tasks - Part 3: Photo Query Feature & Backend Testing

## PR #8: Photo Query Feature (Query Side - CQRS)

### Photo Query DTOs
- [x] 1. Create `features/photoquery/GetPhotosQuery.java` record
- [x] 2. Add field: @NotNull UserId userId
- [x] 3. Add field: @Min(0) Integer page (default 0)
- [x] 4. Add field: @Min(1) @Max(100) Integer size (default 20)
- [x] 5. Add validation annotations
- [x] 6. Create `features/photoquery/PhotoDto.java` record
- [x] 7. Add field: String photoId
- [x] 8. Add field: String fileName
- [x] 9. Add field: UploadStatus status
- [x] 10. Add field: Long fileSize
- [x] 11. Add field: String contentType
- [x] 12. Add field: Instant createdAt
- [x] 13. Add field: Instant uploadedAt (nullable)
- [x] 14. Add field: String downloadUrl (nullable)
- [x] 15. Add static factory method `fromDomain(Photo photo, String downloadUrl)`
- [x] 16. Create `features/photoquery/PhotoQueryResponse.java` record
- [x] 17. Add field: List<PhotoDto> photos
- [x] 18. Add field: Integer currentPage
- [x] 19. Add field: Integer totalPages
- [x] 20. Add field: Long totalElements
- [x] 21. Add field: Integer pageSize

### Photo Query Handler
- [x] 22. Create `features/photoquery/PhotoQueryHandler.java` with @Service
- [x] 23. Inject PhotoRepository via constructor
- [x] 24. Inject S3Service via constructor
- [x] 25. Add SLF4J logger
- [x] 26. Create method `handle(GetPhotosQuery query)` returning PhotoQueryResponse
- [x] 27. Create Pageable object from query.page() and query.size()
- [x] 28. Add sort by createdAt descending
- [x] 29. Call `photoRepository.findByUserId(userId, pageable)`
- [x] 30. Get Page<Photo> result
- [x] 31. For each photo, generate download URL if status is COMPLETED
- [x] 32. Map Photo entities to PhotoDto using fromDomain()
- [x] 33. Create PhotoQueryResponse with photos list and pagination info
- [x] 34. Return response
- [x] 35. Add error handling for repository failures
- [x] 36. Add logging for query execution
- [x] 37. Optimize N+1 query problem if needed (batch URL generation)

### Get Photo By ID Query
- [x] 38. Create `features/photoquery/GetPhotoByIdQuery.java` record
- [x] 39. Add field: @NotNull PhotoId photoId
- [x] 40. Add field: @NotNull UserId userId
- [x] 41. Add method to PhotoQueryHandler: `handleGetById(GetPhotoByIdQuery query)`
- [x] 42. Call `photoRepository.findByIdAndUserId(photoId, userId)`
- [x] 43. Throw exception if photo not found
- [x] 44. Generate download URL if photo is COMPLETED
- [x] 45. Map to PhotoDto and return
- [x] 46. Add error handling

### Photo Query REST Controller
- [x] 47. Create `features/photoquery/PhotoQueryController.java` with @RestController
- [x] 48. Add @RequestMapping("/api/photos")
- [x] 49. Add @CrossOrigin annotation
- [x] 50. Inject PhotoQueryHandler via constructor
- [x] 51. Add SLF4J logger
- [x] 52. Create @GetMapping endpoint (no path)
- [x] 53. Accept @RequestParam String userId (mock auth)
- [x] 54. Accept @RequestParam(defaultValue="0") Integer page
- [x] 55. Accept @RequestParam(defaultValue="20") Integer size
- [x] 56. Convert String userId to UserId object
- [x] 57. Create GetPhotosQuery
- [x] 58. Call queryHandler.handle(query)
- [x] 59. Return ResponseEntity.ok(response)
- [x] 60. Create @GetMapping("/{photoId}") endpoint
- [x] 61. Accept @PathVariable String photoId
- [x] 62. Accept @RequestParam String userId
- [x] 63. Convert parameters to domain objects
- [x] 64. Create GetPhotoByIdQuery
- [x] 65. Call queryHandler.handleGetById(query)
- [x] 66. Return ResponseEntity.ok(photoDto)
- [x] 67. Add @ExceptionHandler for PhotoNotFoundException
- [x] 68. Return 404 status for not found photos

---

## PR #9: Backend Integration Tests

### Test Configuration
- [x] 1. Create `src/test/resources/application-test.yml`
- [x] 2. Configure H2 in-memory database for tests
- [x] 3. Set JPA ddl-auto to create-drop for tests
- [x] 4. Configure test server port (random)
- [x] 5. Add test logging configuration
- [x] 6. Create `src/test/java/com/rapidphoto/config/TestConfig.java`
- [x] 7. Add @TestConfiguration annotation
- [x] 8. Create @Bean for mock S3Service
- [x] 9. Configure Mockito mocks for AWS dependencies

### Batch Upload Integration Tests
- [x] 10. Create `features/batchupload/BatchUploadIntegrationTest.java`
- [x] 11. Add @SpringBootTest annotation
- [x] 12. Add @AutoConfigureMockMvc annotation
- [x] 13. Inject MockMvc
- [x] 14. Inject ObjectMapper for JSON serialization
- [x] 15. Inject PhotoRepository for verification
- [x] 16. Mock S3Service using @MockBean
- [x] 17. Create test: `shouldInitiateBatchUpload()`
- [x] 18. Mock S3Service.generatePresignedUploadUrl() to return test URL
- [x] 19. Create InitiateBatchUploadCommand with 2 photos
- [x] 20. Perform POST /api/photos/batch-init with MockMvc
- [x] 21. Assert response status is 201 CREATED
- [x] 22. Assert response contains 2 uploads
- [x] 23. Assert each upload has photoId, presignedUrl, s3Key, expiresAt
- [x] 24. Verify photoRepository.findAll() returns 2 photos
- [x] 25. Verify all photos have status PENDING
- [x] 26. Create test: `shouldRejectEmptyPhotoList()`
- [x] 27. Send request with empty photos array
- [x] 28. Assert 400 BAD REQUEST status
- [x] 29. Create test: `shouldRejectMoreThan100Photos()`
- [x] 30. Send request with 101 photos
- [x] 31. Assert 400 BAD REQUEST status
- [x] 32. Create test: `shouldHandleS3ServiceFailure()`
- [x] 33. Mock S3Service to throw exception
- [x] 34. Assert 500 INTERNAL SERVER ERROR status
- [x] 35. Verify transaction rollback (no photos saved)

### Photo Completion Integration Tests
- [x] 36. Create `features/photocompletion/PhotoCompletionIntegrationTest.java`
- [x] 37. Add @SpringBootTest and @AutoConfigureMockMvc
- [x] 38. Inject MockMvc, PhotoRepository
- [x] 39. Mock S3Service using @MockBean
- [x] 40. Create test: `shouldCompletePhotoUpload()`
- [x] 41. Create and save a PENDING photo to repository
- [x] 42. Mock S3Service.verifyObjectExists() to return true
- [x] 43. Perform POST /api/photos/{photoId}/complete
- [x] 44. Assert response status is 200 OK
- [x] 45. Assert response status is COMPLETED
- [x] 46. Verify photo in database has status COMPLETED
- [x] 47. Verify photo.uploadedAt is not null
- [x] 48. Verify photo.s3Key is set correctly
- [x] 49. Create test: `shouldReturn404ForNonExistentPhoto()`
- [x] 50. Try to complete photo that doesn't exist
- [x] 51. Assert 404 NOT FOUND status
- [x] 52. Create test: `shouldFailIfS3ObjectNotFound()`
- [x] 53. Mock S3Service.verifyObjectExists() to return false
- [x] 54. Assert 400 BAD REQUEST or 500 status
- [x] 55. Verify photo status remains PENDING
- [x] 56. Create test: `shouldRejectCompletingAlreadyCompletedPhoto()`
- [x] 57. Create and save a COMPLETED photo
- [x] 58. Try to complete it again
- [x] 59. Assert 400 BAD REQUEST status
- [x] 60. Verify IllegalStateException is thrown

### Photo Query Integration Tests
- [x] 61. Create `features/photoquery/PhotoQueryIntegrationTest.java`
- [x] 62. Add @SpringBootTest and @AutoConfigureMockMvc
- [x] 63. Inject MockMvc, PhotoRepository
- [x] 64. Mock S3Service for download URL generation
- [x] 65. Create test: `shouldReturnUserPhotos()`
- [x] 66. Create and save 5 photos for test user
- [x] 67. Perform GET /api/photos?userId={userId}
- [x] 68. Assert response status is 200 OK
- [x] 69. Assert response contains 5 photos
- [x] 70. Assert pagination info is correct (page, totalPages, totalElements)
- [x] 71. Verify photos are sorted by createdAt descending
- [x] 72. Create test: `shouldReturnEmptyListForUserWithNoPhotos()`
- [x] 73. Perform GET with userId that has no photos
- [x] 74. Assert response contains empty array
- [x] 75. Assert totalElements is 0
- [x] 76. Create test: `shouldPaginatePhotos()`
- [x] 77. Create and save 25 photos
- [x] 78. Request page 0 with size 10
- [x] 79. Assert 10 photos returned
- [x] 80. Request page 1 with size 10
- [x] 81. Assert next 10 photos returned
- [x] 82. Create test: `shouldGetPhotoById()`
- [x] 83. Create and save a photo
- [x] 84. Perform GET /api/photos/{photoId}?userId={userId}
- [x] 85. Assert correct photo returned
- [x] 86. Assert download URL present if COMPLETED
- [x] 87. Create test: `shouldReturn404ForNonExistentPhotoId()`
- [x] 88. Request photo that doesn't exist
- [x] 89. Assert 404 NOT FOUND status

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