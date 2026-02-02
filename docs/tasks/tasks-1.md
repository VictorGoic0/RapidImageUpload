# RapidPhotoUpload Tasks - Part 1: Environment Setup & Backend Foundation

## PR #1: Development Environment Setup

### Prerequisites Installation
- [x] 1. Install Java 21 (Temurin/Corretto/Oracle JDK)
- [x] 2. Verify Java installation: `java -version` shows 21.x
- [x] 3. Install Docker Desktop for your OS
- [x] 4. Verify Docker installation: `docker --version` and `docker compose version`
- [x] 5. Install Node.js 20 LTS
- [x] 6. Verify Node installation: `node --version` shows v20.x
- [x] 7. Install AWS CLI v2
- [x] 8. Verify AWS CLI installation: `aws --version`
- [x] 9. Configure AWS credentials: `aws configure`
- [x] 10. Enter AWS Access Key ID, Secret Key, region (us-east-2), output format (json)
- [x] 11. Verify credentials: `cat ~/.aws/credentials`

### AWS S3 Bucket Setup
- [x] 12. Create development S3 bucket: `aws s3 mb s3://rapidphoto-dev --region us-east-2`
- [x] 13. Create production S3 bucket: `aws s3 mb s3://rapidphoto-prod --region us-east-2`
- [x] 14. Create `cors-config.json` file with CORS configuration for S3
- [x] 15. Apply CORS to dev bucket: `aws s3api put-bucket-cors --bucket rapidphoto-dev --cors-configuration file://cors-config.json`
- [x] 16. Apply CORS to prod bucket: `aws s3api put-bucket-cors --bucket rapidphoto-prod --cors-configuration file://cors-config.json`
- [x] 17. Verify buckets created: `aws s3 ls`
- [x] 18. Test S3 access by uploading a test file to dev bucket

### Project Structure Creation
- [x] 19. Create root project directory: `mkdir rapidphoto && cd rapidphoto`
- [x] 20. Initialize Git repository: `git init`
- [x] 21. Create `.gitignore` file at root level
- [x] 22. Add common ignore patterns to `.gitignore` (node_modules, target, .env, etc.)
- [x] 23. Create `README.md` with project overview
- [x] 24. Create `docker-compose.yml` at root level
- [x] 25. Configure PostgreSQL service in docker-compose.yml (image: postgres:16, port 5432)
- [x] 26. Add environment variables to PostgreSQL service (POSTGRES_DB, USER, PASSWORD)
- [x] 27. Add volume mapping for PostgreSQL data persistence
- [x] 28. Add healthcheck to PostgreSQL service
- [x] 29. Start PostgreSQL: `docker compose up -d`
- [x] 30. Verify PostgreSQL running: `docker compose ps`
- [x] 31. Test PostgreSQL connection: `docker exec -it rapidphoto-postgres psql -U postgres -d rapidphoto`

---

## PR #2: Spring Boot Backend Foundation & Domain Models

### Spring Boot Project Initialization
- [x] 1. Navigate to root directory: `cd rapidphoto`
- [x] 2. Create backend directory: `mkdir backend && cd backend`
- [x] 3. Generate Spring Boot project using Spring Initializr (web, websocket, data-jpa, postgresql, validation)
- [x] 4. Extract downloaded project to `backend/` directory
- [x] 5. Open project in IDE (IntelliJ IDEA or VS Code)
- [x] 6. Verify `pom.xml` contains all required dependencies
- [x] 7. Add AWS S3 SDK dependency to `pom.xml` (software.amazon.awssdk:s3:2.20.0)
- [x] 8. Add Jakarta validation dependency if missing
- [x] 9. Reload Maven dependencies in IDE

### Application Configuration
- [x] 10. Create `src/main/resources/application.yml`
- [x] 11. Configure Spring application name: `rapidphoto`
- [x] 12. Set active profile to `dev` by default
- [x] 13. Configure JPA settings (hibernate ddl-auto: update, show-sql: true)
- [x] 14. Create development profile section in application.yml
- [x] 15. Configure dev datasource URL: `jdbc:postgresql://localhost:5432/rapidphoto`
- [x] 16. Set dev datasource username: `postgres`
- [x] 17. Set dev datasource password: `postgres`
- [x] 18. Add AWS S3 configuration for dev: bucket name `rapidphoto-dev`, region `us-east-2`
- [x] 19. Set server port: 8080
- [x] 20. Create production profile section in application.yml
- [x] 21. Configure prod datasource with environment variable placeholders
- [x] 22. Add AWS S3 configuration for prod: bucket name `rapidphoto-prod`
- [x] 23. Create `application-dev.yml` for dev-specific overrides (optional)
- [x] 24. Create `application-prod.yml` for prod-specific overrides (optional)

### Project Structure Setup
- [x] 25. Create package: `com.rapidphoto.config`
- [x] 26. Create package: `com.rapidphoto.domain`
- [x] 27. Create package: `com.rapidphoto.features`
- [x] 28. Create package: `com.rapidphoto.infrastructure`
- [x] 29. Create subdirectory: `features/batchupload`
- [x] 30. Create subdirectory: `features/photoquery`
- [x] 31. Create subdirectory: `features/photocompletion`
- [x] 32. Create subdirectory: `domain` (for shared domain models)
- [x] 33. Create subdirectory: `infrastructure/s3`
- [x] 34. Create subdirectory: `infrastructure/websocket`

### Domain Models (DDD)
- [x] 35. Create `domain/UploadStatus.java` enum with values: PENDING, UPLOADING, COMPLETED, FAILED
- [x] 36. Create `domain/PhotoId.java` as @Embeddable record with UUID field
- [x] 37. Add static factory method `PhotoId.generate()` to create new UUIDs
- [x] 38. Create `domain/UserId.java` as @Embeddable record with UUID field
- [x] 39. Create `domain/Photo.java` entity class with @Entity annotation
- [x] 40. Add @EmbeddedId PhotoId to Photo entity
- [x] 41. Add @Embedded UserId to Photo entity
- [x] 42. Add String fileName field to Photo
- [x] 43. Add String s3Key field to Photo (nullable initially)
- [x] 44. Add @Enumerated(EnumType.STRING) UploadStatus status field
- [x] 45. Add Long fileSize field to Photo
- [x] 46. Add String contentType field to Photo
- [x] 47. Add LocalDateTime createdAt field with @CreationTimestamp
- [x] 48. Add LocalDateTime uploadedAt field (nullable)
- [x] 49. Create static factory method `Photo.createPending()` for new uploads
- [x] 50. Add business logic method `markAsCompleted(String s3Key)` to Photo
- [x] 51. Add business logic method `markAsFailed(String errorMessage)` to Photo
- [x] 52. Add validation in markAsCompleted to ensure status is PENDING
- [x] 53. Add equals() and hashCode() methods based on PhotoId
- [x] 54. Add toString() method for debugging
- [x] 55. Create `domain/PhotoRepository.java` interface extending JpaRepository
- [x] 56. Add custom query method: `List<Photo> findByUserIdOrderByCreatedAtDesc(UserId userId)`
- [x] 57. Add custom query method: `Page<Photo> findByUserId(UserId userId, Pageable pageable)`
- [x] 58. Add custom query method: `Optional<Photo> findByIdAndUserId(PhotoId id, UserId userId)`

---

## PR #3: AWS S3 Integration & Configuration

### AWS S3 Configuration
- [x] 1. Create `config/S3Config.java` class with @Configuration annotation
- [x] 2. Add @Value annotation to inject AWS region from application.yml
- [x] 3. Add @Value annotation to inject S3 bucket name from application.yml
- [x] 4. Create @Bean method for S3Client with default credentials provider
- [x] 5. Configure S3Client with region from properties
- [x] 6. Add S3Client builder with proper configuration
- [x] 7. Create S3Properties record class to hold bucket and region configuration
- [x] 8. Add @ConfigurationProperties binding for AWS S3 properties

### S3 Service Implementation
- [x] 9. Create `infrastructure/s3/S3Service.java` class with @Service annotation
- [x] 10. Inject S3Client via constructor
- [x] 11. Inject S3Properties for bucket name and region
- [x] 12. Add SLF4J logger to S3Service
- [x] 13. Create method `generatePresignedUploadUrl(String key, String contentType)`
- [x] 14. Implement S3Presigner for upload URL generation
- [x] 15. Set presigned URL expiration to 15 minutes
- [x] 16. Configure PUT method for upload URL
- [x] 17. Add content-type header to presigned request
- [x] 18. Return presigned URL as String
- [x] 19. Add error handling and logging for URL generation
- [x] 20. Create method `generatePresignedDownloadUrl(String key)`
- [x] 21. Implement S3Presigner for download URL generation
- [x] 22. Set download URL expiration to 60 minutes
- [x] 23. Configure GET method for download URL
- [x] 24. Return download URL as String
- [x] 25. Add error handling and logging for download URL generation
- [x] 26. Create method `generateS3Key(UserId userId, String fileName)` for consistent key structure
- [x] 27. Implement key format: `users/{userId}/photos/{uuid}-{fileName}`
- [x] 28. Add method to sanitize fileName (remove special characters, spaces)
- [x] 29. Create method `verifyObjectExists(String key)` to check if upload completed
- [x] 30. Implement HeadObjectRequest to check S3 object existence
- [x] 31. Return boolean indicating if object exists
- [x] 32. Add proper exception handling for S3 operations

### S3 DTOs and Models
- [ ] 33. Create `infrastructure/s3/PresignedUrlResponse.java` record
- [ ] 34. Add fields: String presignedUrl, String s3Key, Instant expiresAt
- [x] 35. Create `infrastructure/s3/S3UploadException.java` custom exception
- [x] 36. Extend RuntimeException with custom message
- [x] 37. Add constructors for different error scenarios

---

## PR #4: Virtual Threads & Async Configuration

### Async Configuration
- [x] 1. Create `config/AsyncConfig.java` class with @Configuration annotation
- [x] 2. Add @EnableAsync annotation to enable Spring async support
- [x] 3. Create @Bean method `taskExecutor()` returning Executor
- [x] 4. Check Java version is 21+ for Virtual Threads support
- [x] 5. Use `Executors.newVirtualThreadPerTaskExecutor()` for Java 21+
- [x] 6. Add fallback to ThreadPoolTaskExecutor for older Java versions
- [x] 7. Configure executor bean name: "taskExecutor"
- [x] 8. Add logging to indicate Virtual Threads are enabled
- [x] 9. Configure uncaught exception handler for async methods
- [x] 10. Add @Bean for AsyncUncaughtExceptionHandler

### Application Properties Enhancement
- [x] 11. Add Spring async configuration to application.yml
- [x] 12. Enable virtual threads: `spring.threads.virtual.enabled=true` (if Spring Boot 3.2+)
- [x] 13. Configure thread naming pattern for debugging
- [x] 14. Add async pool size configuration (for fallback executor)
- [x] 15. Set queue capacity for async executor