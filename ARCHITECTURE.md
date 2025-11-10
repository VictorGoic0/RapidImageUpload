# RapidPhotoUpload Architecture

## Overview

RapidPhotoUpload is a production-grade, high-performance photo upload system demonstrating architectural excellence through Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), and Vertical Slice Architecture (VSA). The system handles up to 100 concurrent photo uploads while maintaining a fully responsive, non-blocking user experience.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Web Client     │         │  Mobile Client   │
│  (React)        │         │  (React Native)  │
└────────┬────────┘         └────────┬─────────┘
         │                            │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │  Application Load Balancer │
         │  (AWS Elastic Beanstalk)   │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   Spring Boot Backend      │
         │   (Java 21 + Virtual Threads)│
         └────────────┬───────────────┘
                      │
         ┌────────────┼───────────────┐
         │            │               │
    ┌────▼────┐  ┌────▼────┐  ┌──────▼──────┐
    │PostgreSQL│  │  S3     │  │  WebSocket  │
    │   RDS    │  │ Buckets │  │   Service   │
    └──────────┘  └─────────┘  └─────────────┘
```

See `diagrams/architecture.mermaid` for a detailed architecture diagram.

## Architectural Principles

### 1. Domain-Driven Design (DDD)

The system follows DDD principles with clear domain boundaries and encapsulated business logic.

#### Core Domain Models

**Photo Entity** (`com.rapidphoto.domain.Photo`)
- Represents an uploaded image with its complete lifecycle
- Contains business logic methods:
  - `markAsCompleted(String s3Key)`: Transitions photo from PENDING to COMPLETED
  - `markAsFailed()`: Marks upload as failed
  - Validation: Can only complete pending uploads (throws `IllegalStateException` if invalid)

**Value Objects**
- `PhotoId`: UUID-based identifier, @Embeddable
- `UserId`: UUID-based identifier, @Embeddable
- `UploadStatus`: Enum (PENDING, UPLOADING, COMPLETED, FAILED)

**Domain Services**
- `PhotoRepository`: Data access abstraction (Spring Data JPA interface)
- `PresignedUrlGenerator`: Creates time-limited S3 URLs (in Infrastructure layer)

**Key Rule**: Business logic lives IN domain objects, not in services or controllers.

Example:
```java
@Entity
public class Photo {
    public void markAsCompleted(String s3Key) {
        if (this.status != UploadStatus.PENDING) {
            throw new IllegalStateException("Can only complete pending uploads");
        }
        this.status = UploadStatus.COMPLETED;
        this.s3Key = s3Key;
        this.uploadedAt = LocalDateTime.now();
    }
}
```

### 2. Command Query Responsibility Segregation (CQRS)

The system separates write operations (Commands) from read operations (Queries) for independent optimization and scaling.

#### Command Side (Writes)

**Batch Upload Feature** (`/features/batchupload/`)
- `BatchUploadController`: REST endpoint `/api/photos/batch-init`
- `BatchUploadCommandHandler`: Processes `InitiateBatchUploadCommand`
- Creates Photo entities (PENDING status)
- Generates presigned URLs for direct S3 uploads
- Returns `BatchUploadResponse` with upload information

**Photo Completion Feature** (`/features/photocompletion/`)
- `PhotoCompletionController`: REST endpoint `/api/photos/{photoId}/complete`
- `PhotoCompletionCommandHandler`: Processes `CompletePhotoUploadCommand`
- Verifies S3 object exists
- Updates Photo status to COMPLETED
- Broadcasts completion via WebSocket

#### Query Side (Reads)

**Photo Query Feature** (`/features/photoquery/`)
- `PhotoQueryController`: REST endpoint `/api/photos`
- `PhotoQueryHandler`: Processes `GetPhotosQuery`
- Fetches photos with pagination
- Generates presigned download URLs
- Returns `PhotoQueryResponse` with photo DTOs

**Separation Benefits:**
- Commands: Async, can be queued, focus on business rules
- Queries: Synchronous, optimized for read performance
- Independent scaling and optimization

### 3. Vertical Slice Architecture (VSA)

Features are organized as self-contained vertical slices, each containing all layers needed for that feature.

#### Feature Organization

```
/features/
  /batchupload/          # Complete feature in one slice
    - BatchUploadController.java
    - BatchUploadCommandHandler.java
    - InitiateBatchUploadCommand.java
    - BatchUploadResponse.java
  
  /photoquery/           # Complete feature in one slice
    - PhotoQueryController.java
    - PhotoQueryHandler.java
    - GetPhotosQuery.java
    - PhotoQueryResponse.java
  
  /photocompletion/      # Complete feature in one slice
    - PhotoCompletionController.java
    - CompletePhotoUploadCommand.java
    - PhotoCompletionCommandHandler.java

/domain/                  # Shared across features
  - Photo.java
  - PhotoId.java
  - UserId.java
  - PhotoRepository.java
  - UploadStatus.java

/infrastructure/          # Shared services
  - S3Service.java
  - WebSocketProgressService.java
  - DatabaseConfig.java
```

**Key Rule**: Each feature is self-contained. Only domain models and infrastructure are shared.

## Core Technical Patterns

### Presigned URL Strategy

**Rationale**: Direct client-to-S3 uploads eliminate backend bandwidth bottlenecks, enabling the system to handle 100 concurrent uploads efficiently.

#### Implementation

1. **URL Generation** (`S3Service.generatePresignedUploadUrl()`)
   - Expiration: 15 minutes
   - Method: PUT
   - Content-Type: Preserved from client request
   - S3 Key Format: `users/{userId}/photos/{uuid}-{sanitizedFileName}`

2. **Upload Flow**
   ```
   Client → POST /api/photos/batch-init
   Backend → Creates Photo entities, generates presigned URLs
   Client → Uploads directly to S3 via presigned URL (XHR PUT)
   Client → POST /api/photos/{photoId}/complete
   Backend → Verifies S3 object exists, marks Photo as COMPLETED
   ```

3. **Security**
   - URLs expire after 15 minutes
   - URLs are single-use (PUT operation)
   - S3 bucket is not publicly listable
   - Direct S3 access requires presigned URL

4. **Download URLs**
   - Separate presigned URLs for downloads
   - Expiration: 60 minutes
   - Method: GET
   - Generated on-demand when querying photos

#### Benefits
- Zero backend bandwidth consumption
- Scales to handle 100+ concurrent uploads
- Reduced latency (direct client-to-S3)
- Cost-effective (no data transfer through backend)

### WebSocket Throttling Implementation

**Problem**: Without throttling, 100 concurrent uploads would generate ~10,000 WebSocket progress events, overwhelming the backend.

**Solution**: Throttle progress updates to 300-millisecond intervals while maintaining instant local UI updates.

#### Frontend Implementation

**Location**: `web-client/src/hooks/useThrottledProgress.ts` and `mobile-client/hooks/useThrottledProgress.ts`

```typescript
const throttledSend = useCallback(
  (photoId: string, progressPercent: number, ...) => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current.get(photoId) || 0;
    const timeSinceLastUpdate = now - lastUpdate;

    // Send update if:
    // 1. Enough time has passed since last update (300ms default), OR
    // 2. Progress is 100% (always send completion)
    const shouldSend = timeSinceLastUpdate >= throttleMs || progressPercent >= 100;

    if (shouldSend) {
      sendProgress(progressData);
      lastUpdateRef.current.set(photoId, now);
    }
  },
  [sendProgress, throttleMs]
);
```

#### Upload Progress Flow

```typescript
xhr.upload.addEventListener('progress', (e) => {
  const percent = Math.round((e.loaded / e.total) * 100);
  
  // ALWAYS update local UI (instant feedback)
  setLocalProgress(photoId, percent);
  
  // THROTTLED WebSocket updates (reduces load)
  throttledSend(photoId, percent, { fileName, status, message, timestamp });
});
```

#### Backend Implementation

**Location**: `backend/src/main/java/com/rapidphoto/infrastructure/websocket/`

- `WebSocketProgressService`: Broadcasts progress updates to all connected sessions
- `UploadProgressController`: Receives progress updates from clients
- Uses STOMP protocol for message routing

#### Benefits
- Reduces WebSocket messages from 10,000 to ~3,000 (for 100 uploads)
- Backend processes manageable load
- Still provides real-time feel (300ms updates)
- Always sends 100% completion message (bypasses throttle)

### Virtual Threads Concurrency Approach

**Technology**: Java 21 Virtual Threads (Project Loom)

#### Configuration

**Location**: `backend/src/main/java/com/rapidphoto/config/AsyncConfig.java`

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        if (JAVA_VERSION >= 21) {
            return Executors.newVirtualThreadPerTaskExecutor();
        } else {
            // Fallback to ThreadPoolTaskExecutor
        }
    }
}
```

#### Usage

Commands use `@Async` annotation with virtual thread executor:

```java
@Async("taskExecutor")
public CompletableFuture<BatchUploadResponse> handle(InitiateBatchUploadCommand command) {
    // Process batch upload asynchronously
}
```

#### Benefits
- Enables millions of concurrent operations with minimal overhead
- No thread pool size limits (unlike traditional thread pools)
- Efficient for I/O-bound operations (S3, database)
- Automatic resource management

### Technology Choices and Trade-offs

#### Backend Stack

**Java 21 + Spring Boot 3.3+**
- **Why**: Virtual Threads support, modern Spring features, strong ecosystem
- **Trade-off**: Requires Java 21+ (newer requirement)

**PostgreSQL 16**
- **Why**: Robust, ACID-compliant, excellent JSON support, production-ready
- **Trade-off**: Requires managed database (RDS) for production

**AWS S3**
- **Why**: Scalable object storage, presigned URLs, cost-effective
- **Trade-off**: Vendor lock-in, but industry standard

**Raw WebSocket (JSR-356)**
- **Why**: Low-latency, efficient, native Spring support
- **Trade-off**: More complex than REST, but necessary for real-time updates

#### Frontend Stack

**React 19.1.1 + TypeScript**
- **Why**: Modern, type-safe, excellent developer experience
- **Trade-off**: Larger bundle size than vanilla JS, but worth it for maintainability

**Vite**
- **Why**: Fast development server, optimized production builds
- **Trade-off**: Newer tool, but stable and widely adopted

**Shadcn/ui + Tailwind CSS**
- **Why**: Beautiful, accessible components, utility-first CSS
- **Trade-off**: Learning curve, but excellent DX

**React Native (Expo)**
- **Why**: Cross-platform mobile development, hot reload
- **Trade-off**: Less native performance than native apps, but sufficient for MVP

### AWS Infrastructure

#### S3 Buckets

**Development**: `rapidphoto-dev`
- Used for local development and testing
- CORS configured for localhost origins

**Production**: `rapidphoto-prod`
- Used for production deployments
- CORS configured for Netlify domain

**Key Structure**: `users/{userId}/photos/{uuid}-{sanitizedFileName}`

#### RDS (PostgreSQL)

**Instance**: `rapidphoto-prod`
- Engine: PostgreSQL 16
- Instance Class: db.t3.micro (free tier eligible)
- Storage: 20 GB gp2 with autoscaling up to 100 GB
- Public Access: Enabled for MVP (restrict in production)
- Backups: 7-day retention

#### ECS Fargate (via Elastic Beanstalk)

**Deployment**: Spring Boot application
- Platform: Java 21
- Load Balancer: Application Load Balancer (ALB)
- SSL: HTTPS on port 443 (ACM certificate)
- Auto-scaling: Configured for production load

**Benefits**:
- No server management
- Automatic scaling
- Integrated with ALB for SSL termination

## System Flow Patterns

### Upload Process (Complete Flow)

See `diagrams/upload.mermaid` for a detailed sequence diagram.

1. **Initiate Batch Upload** (Command)
   - Client → POST `/api/photos/batch-init` with photo metadata
   - Backend creates Photo entities (PENDING status)
   - Backend generates presigned URLs (15-minute expiration)
   - Backend returns upload information

2. **Direct S3 Upload** (Client → S3)
   - Client uploads files directly to S3 via presigned URLs (XHR PUT)
   - Client tracks progress locally (instant UI updates)
   - Client sends throttled progress updates via WebSocket (every 300ms)

3. **Complete Upload Notification** (Command)
   - Client → POST `/api/photos/{photoId}/complete` with S3 key
   - Backend verifies S3 object exists (HEAD request)
   - Backend updates Photo status to COMPLETED
   - Backend broadcasts completion via WebSocket

4. **Query Photos** (Query)
   - Client → GET `/api/photos?userId={id}&page=0&size=20`
   - Backend fetches photos from database (paginated)
   - Backend generates presigned download URLs (60-minute expiration)
   - Client downloads photos directly from S3

### WebSocket Progress Architecture

```
Client                          Backend                         Database
  |                                |                                |
  |--- Connect WS /ws -----------→|                                |
  |←-- Connected ------------------|                                |
  |                                |                                |
  |--- Subscribe /user/queue/progress                              |
  |                                |                                |
  |--- Upload to S3 (XHR) ------→ S3                               |
  |    (tracking progress)         |                                |
  |                                |                                |
  |--- WS: {photoId, 23%} -------→|                                |
  |    (throttled, every 300ms)    |                                |
  |                                |--- UPDATE progress ----------→|
  |                                |                                |
  |←-- WS: {photoId, 23%} ---------|                                |
  |    (broadcast to all sessions) |                                |
  |                                |                                |
  |--- POST /complete -----------→|                                |
  |                                |--- UPDATE status=COMPLETED --→|
  |←-- 200 OK --------------------|                                |
  |                                |                                |
  |←-- WS: {photoId, COMPLETED} --|                                |
```

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

## Performance Characteristics

### Target Metrics
- **100 concurrent uploads** (2MB each) complete within **90 seconds**
- **Zero UI blocking** during upload operations
- **Real-time progress** updates (300ms intervals)
- **Backend API response time**: <500ms average

### Optimization Strategies
1. **Direct S3 Uploads**: Eliminates backend bandwidth bottleneck
2. **WebSocket Throttling**: Reduces message volume by ~70% (from 10,000 to ~3,000 for 100 uploads)
3. **Virtual Threads**: Enables high concurrency with minimal overhead
4. **Async Processing**: Non-blocking command execution
5. **Pagination**: Efficient photo querying (20 photos per page)

## Security Considerations

### Presigned URLs
- **Expiration**: 15 minutes (upload), 60 minutes (download)
- **Single-use**: PUT operations are idempotent but time-limited
- **Content-Type validation**: Enforced in presigned URL generation

### S3 Bucket Security
- **Not publicly listable**: Bucket policy restricts public access
- **Direct access requires presigned URL**: No anonymous access
- **CORS configured**: Only allows intended origins

### Database Security
- **Credentials**: Stored in environment variables (not in code)
- **Connection**: Encrypted (SSL/TLS)
- **Public access**: Enabled for MVP (restrict in production)

### CORS Configuration
- **Centralized**: All CORS configuration in `CorsConfig.java`
- **Allowed origins**: Development (localhost:5173-5177), Production (Netlify domain)
- **Never hardcode**: Always use `CorsConfig.ALLOWED_ORIGINS` constant

## Deployment Architecture

### Development
- **Backend**: Local Spring Boot (port 8080)
- **Database**: PostgreSQL Docker container (port 5432)
- **S3**: `rapidphoto-dev` bucket
- **Web Client**: Vite dev server (port 5173)
- **Mobile Client**: Expo Go app

### Production
- **Backend**: AWS Elastic Beanstalk (ECS Fargate) with ALB + SSL
- **Database**: AWS RDS PostgreSQL 16
- **S3**: `rapidphoto-prod` bucket
- **Web Client**: Netlify (CDN + automatic SSL)
- **Mobile Client**: Expo Go app (connects to production backend)

## Future Enhancements

1. **Authentication**: JWT-based authentication with Spring Security
2. **Retry Logic**: Automatic retry for failed uploads
3. **Photo Tagging**: Add/edit tags for organization
4. **Image Processing**: Thumbnail generation, resizing
5. **Analytics**: Upload metrics, user activity tracking
6. **Multi-region**: S3 bucket replication for global access

## References

- **Architecture Diagrams**: See `diagrams/` directory
- **PRD**: See `PRD.md` for detailed requirements
- **Memory Bank**: See `memory-bank/` for project context and patterns
- **System Patterns**: See `memory-bank/systemPatterns.md` for implementation patterns

