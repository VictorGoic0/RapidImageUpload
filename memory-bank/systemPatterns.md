# System Patterns: RapidPhotoUpload

## Architectural Principles

### Domain-Driven Design (DDD)

**Core Domain Models:**
- **Photo** (Entity): Represents uploaded image with lifecycle
  - Business logic methods: `markAsCompleted()`, `markAsFailed()`
  - Validation: Can only complete pending uploads
- **PhotoId** (Value Object): UUID-based identifier, @Embeddable
- **UserId** (Value Object): UUID-based identifier, @Embeddable
- **UploadStatus** (Enum): PENDING, UPLOADING, COMPLETED, FAILED
- **S3Key** (Value Object): Storage location reference

**Domain Services:**
- `PhotoUploadService`: Orchestrates upload workflow
- `PresignedUrlGenerator`: Creates time-limited S3 URLs (in Infrastructure layer)

**Repositories:**
- `PhotoRepository`: Data access abstraction (Spring Data JPA)

**Key Rule**: Business logic lives IN domain objects, not in services or controllers.

### Command Query Responsibility Segregation (CQRS)

**Command Side (Writes):**
```
/features/batchupload/
  - BatchUploadController
  - BatchUploadCommandHandler
  - InitiateBatchUploadCommand

/features/photocompletion/
  - PhotoCompletionController
  - PhotoCompletionCommandHandler
  - CompletePhotoUploadCommand

/features/photodelete/
  - DeletePhotoController
  - DeletePhotoCommandHandler
  - DeletePhotoCommand
  - PhotoNotFoundException
```

**Query Side (Reads):**
```
/features/photoquery/
  - PhotoQueryController
  - PhotoQueryHandler
  - GetPhotosQuery
  - PhotoQueryResponse
```

**Separation Benefits:**
- Commands: Async, can be queued, focus on business rules
- Queries: Synchronous, optimized for read performance
- Independent scaling and optimization

### Vertical Slice Architecture (VSA)

**Feature-Based Organization:**
```
/features/
  /batch-upload/          # Complete feature in one slice
    - BatchUploadController.java
    - BatchUploadCommandHandler.java
    - InitiateBatchUploadCommand.java
    - BatchUploadResponse.java
  
  /photo-query/           # Complete feature in one slice
    - PhotoQueryController.java
    - PhotoQueryHandler.java
    - GetPhotosQuery.java
    - PhotoQueryResponse.java
  
  /photo-completion/      # Complete feature in one slice
    - PhotoCompletionController.java
    - CompletePhotoUploadCommand.java
    - PhotoCompletionCommandHandler.java
  
  /photodelete/           # Complete feature in one slice
    - DeletePhotoController.java
    - DeletePhotoCommand.java
    - DeletePhotoCommandHandler.java
    - PhotoNotFoundException.java

/domain/                  # Shared across features
  - Photo.java
  - PhotoId.java
  - UserId.java
  - PhotoRepository.java
  - UploadStatus.java

/infrastructure/          # Shared services
  - S3Service.java (includes deleteObject method)
  - WebSocketProgressService.java
  - DatabaseConfig.java
```

**Key Rule**: Each feature is self-contained. Only domain models and infrastructure are shared.

## System Flow Patterns

### Upload Process (Presigned URL Strategy)
1. Client → POST `/api/photos/batch-init` with photo metadata
2. Backend creates Photo entities (PENDING), generates presigned URLs
3. Client receives presigned URLs, uploads directly to S3 via XHR PUT
4. Client tracks progress locally (instant UI), sends throttled updates via WebSocket
5. Client → POST `/api/photos/{photoId}/complete` when upload finishes
6. Backend updates Photo.status to COMPLETED, broadcasts via WebSocket

### WebSocket Progress Architecture
- Client connects to `/ws` endpoint
- Subscribes to `/user/queue/progress` for user-specific updates
- Sends progress via `/app/upload-progress` (throttled to 2-second intervals)
- Backend broadcasts to all connected user sessions
- Always sends 100% completion message (bypasses throttle)

### Throttling Pattern
```typescript
// Frontend: Always update local UI, throttle WebSocket
xhr.upload.addEventListener('progress', (e) => {
  const percent = Math.round((e.loaded / e.total) * 100);
  setLocalProgress(photoId, percent); // Instant UI update
  
  // Throttled WebSocket (every 2s or at 100%)
  if (shouldSendUpdate(percent)) {
    sendProgress(photoId, percent);
  }
});
```

**Benefits**: Reduces 10,000 events to ~500 while maintaining real-time feel.

## Concurrency Patterns

### Virtual Threads (Java 21)
- Use `Executors.newVirtualThreadPerTaskExecutor()` for async operations
- Enables millions of concurrent operations with minimal overhead
- Configured in `AsyncConfig.java` with `@EnableAsync`
- TaskScheduler bean also defined in AsyncConfig for WebSocket heartbeat (avoids circular dependency with WebSocketConfig)

### Async Processing
- Commands use `@Async` annotation with virtual thread executor
- Non-blocking database operations via Spring Data JPA
- WebSocket operations are non-blocking by default

## CORS Configuration Pattern

### Centralized CORS Management
**CRITICAL**: All CORS configuration is centralized in `CorsConfig.java` to ensure consistency across the application.

**Location**: `com.rapidphoto.config.CorsConfig`

**Allowed Origins** (5 front-end domains):
- `http://localhost:5173` (Primary Vite dev server)
- `http://localhost:5174` (Secondary Vite dev server)
- `http://localhost:5175` (Tertiary Vite dev server)
- `http://localhost:5176` (Quaternary Vite dev server)
- `http://localhost:5177` (Quinary Vite dev server)

**Usage Pattern**:
1. **REST Controllers**: CORS is configured globally via `CorsConfig.addCorsMappings()`. 
   - Do NOT use `@CrossOrigin` on individual controllers unless you need different settings.
   - All `/api/**` endpoints automatically use the centralized configuration.

2. **WebSocket**: `WebSocketConfig.java` imports `CorsConfig.ALLOWED_ORIGINS` constant.
   - Always use the constant, never hardcode origins in WebSocketConfig.

**When Adding New Front-End Domains**:
1. Update `CorsConfig.ALLOWED_ORIGINS` constant
2. Verify `WebSocketConfig.java` uses the constant (already done)
3. No need to update individual controllers (global config applies)
4. Update this documentation

**Key Rule**: Never hardcode CORS origins in controllers or WebSocket config. Always use `CorsConfig.ALLOWED_ORIGINS`.

## Error Handling Patterns

### Domain Validation
- Business rules enforced in domain objects (e.g., `Photo.markAsCompleted()`)
- Throw `IllegalStateException` for invalid state transitions

### Infrastructure Errors
- S3 operations wrapped in try-catch with custom `S3UploadException`
- WebSocket errors logged and handled gracefully
- Database errors propagate as Spring Data exceptions

### Client-Side Error Handling
- Network failures: Retry logic (future enhancement)
- S3 upload failures: Mark as FAILED, allow retry
- WebSocket disconnection: Auto-reconnect with exponential backoff

## Testing Patterns

### Integration Tests
- Mock S3Service for presigned URL generation
- Use `@SpringBootTest` with `@AutoConfigureMockMvc`
- Test complete upload flow: init → upload → complete → query

### WebSocket Tests
- Use STOMP client in tests to verify message broadcasting
- Test throttling behavior (verify 2-second intervals)

### Performance Tests
- Use k6 or Apache Bench for concurrency testing
- Target: 100 concurrent requests, <500ms average response time

