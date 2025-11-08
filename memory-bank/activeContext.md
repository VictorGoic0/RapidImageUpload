# Active Context: RapidPhotoUpload

## Current Status
**Phase**: Backend Foundation
**Date**: 2025-01-27
**Focus**: WebSocket Configuration & Infrastructure (PR #5)

## Recent Changes
- **PR #1 Complete**: Development environment fully set up
  - Java 21 installed and verified (OpenJDK 21.0.9)
  - Docker Desktop installed and running
  - Node.js v22.12.0 installed (project requires 20 LTS, but 22 works)
  - AWS CLI v2 installed and configured
  - AWS credentials configured for us-east-2 (Ohio) region
  - S3 buckets created: `rapidphoto-dev` and `rapidphoto-prod` in us-east-2
  - CORS configured for both S3 buckets
  - PostgreSQL 16 running in Docker container (healthy)
  - Project structure initialized (README.md, docker-compose.yml)
  - Git repository initialized
  - Maven 3.9.11 installed and configured to use Java 21
- **PR #2 Complete**: Spring Boot Backend Foundation & Domain Models
  - Spring Boot 3.3.0 project created with all required dependencies
  - `pom.xml` configured with Web, WebSocket, Data JPA, PostgreSQL, Validation, AWS S3 SDK
  - `application.yml` with base configuration and dev/prod profiles
  - `application-dev.yml` and `application-prod.yml` created for profile-specific overrides
  - Package structure created (config, domain, features, infrastructure)
  - Domain models implemented:
    - `UploadStatus` enum (PENDING, UPLOADING, COMPLETED, FAILED)
    - `PhotoId` embeddable record with UUID and factory method
    - `UserId` embeddable record with UUID
    - `Photo` entity with all fields, business logic methods, and validation
  - `PhotoRepository` interface with custom query methods
  - Project compiles successfully with Java 21
- **PR #3 Complete**: AWS S3 Integration & Configuration
  - `S3Config.java` with @Configuration and @Bean for S3Client
  - `S3Properties` record for configuration binding (@ConfigurationProperties)
  - `S3Service` implementation with:
    - `generatePresignedUploadUrl()` - 15-minute expiration, PUT method
    - `generatePresignedDownloadUrl()` - 60-minute expiration, GET method
    - `generateS3Key()` - Consistent key structure: `users/{userId}/photos/{uuid}-{sanitizedFileName}`
    - `sanitizeFileName()` - Removes special characters, sanitizes file names
    - `verifyObjectExists()` - HEAD request to verify S3 object existence
  - `S3UploadException` custom exception with multiple constructors
  - Proper error handling and logging throughout
  - S3Presigner configured for presigned URL generation
- **PR #4 Complete**: Virtual Threads & Async Configuration
  - `AsyncConfig.java` with @Configuration and @EnableAsync
  - Virtual thread executor for Java 21+ using `Executors.newVirtualThreadPerTaskExecutor()`
  - Fallback to ThreadPoolTaskExecutor for older Java versions
  - Custom AsyncUncaughtExceptionHandler for logging async exceptions
  - Java version detection and automatic executor selection
  - Async configuration in application.yml:
    - `spring.threads.virtual.enabled=true` for Spring Boot native support
    - Thread naming pattern: `async-`
    - Fallback pool configuration (core: 10, max: 50, queue: 1000)
- Memory bank structure created
- Project brief, product context, system patterns, and tech context documented
- Cursor rules directory initialized

## Current Work Focus
1. **WebSocket Configuration** (Tasks-2.md, PR #5) - **NEXT**
   - WebSocketConfig with STOMP endpoint configuration
   - WebSocket DTOs (PhotoProgress)
   - WebSocketProgressService for progress broadcasting
   - UploadProgressController for handling WebSocket messages

## Next Steps (Immediate)
1. Create WebSocketConfig with STOMP endpoint and message broker
2. Create PhotoProgress DTO with factory methods
3. Implement WebSocketProgressService for user/topic broadcasting
4. Create UploadProgressController for message handling
5. Proceed to PR #6: Batch Upload Feature

## Active Decisions & Considerations

### Architecture Decisions
- **Presigned URLs**: Chosen to eliminate backend bandwidth bottleneck
- **WebSocket Throttling**: 2-second intervals to reduce backend load while maintaining real-time feel
- **Virtual Threads**: Leveraging Java 21 for high concurrency without thread pool exhaustion
- **Vertical Slices**: Organizing by feature (batch-upload, photo-query, photo-completion) for maintainability

### Technical Decisions
- **PostgreSQL 16**: Latest stable version for metadata storage
- **Spring Boot 3.3+**: Required for Java 21 and virtual threads support
- **React 18.3.1**: Latest stable with concurrent features
- **Expo SDK 51+**: Latest stable for React Native mobile app

### Pending Decisions
- Migration tool: Flyway vs Liquibase (to be decided during implementation)
- Error recovery strategy: Retry logic implementation details
- Testing approach: Unit test coverage vs integration test focus

## Known Issues
- None yet (project initialization phase)

## Blockers
- None currently

## Notes
- MVP uses mocked user IDs; JWT authentication deferred to post-MVP
- Focus on core upload/progress functionality first
- Deployment to AWS planned for Day 4
- Demo video and documentation scheduled for Day 5

