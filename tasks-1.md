# RapidPhotoUpload Tasks - Part 1: Environment Setup & Backend Foundation

## PR #1: Development Environment Setup

### Prerequisites Installation
- [ ] 1. Install Java 21 (Temurin/Corretto/Oracle JDK)
- [ ] 2. Verify Java installation: `java -version` shows 21.x
- [ ] 3. Install Docker Desktop for your OS
- [ ] 4. Verify Docker installation: `docker --version` and `docker compose version`
- [ ] 5. Install Node.js 20 LTS
- [ ] 6. Verify Node installation: `node --version` shows v20.x
- [ ] 7. Install AWS CLI v2
- [ ] 8. Verify AWS CLI installation: `aws --version`
- [ ] 9. Configure AWS credentials: `aws configure`
- [ ] 10. Enter AWS Access Key ID, Secret Key, region (us-east-1), output format (json)
- [ ] 11. Verify credentials: `cat ~/.aws/credentials`

### AWS S3 Bucket Setup
- [ ] 12. Create development S3 bucket: `aws s3 mb s3://rapidphoto-dev --region us-east-1`
- [ ] 13. Create production S3 bucket: `aws s3 mb s3://rapidphoto-prod --region us-east-1`
- [ ] 14. Create `cors-config.json` file with CORS configuration for S3
- [ ] 15. Apply CORS to dev bucket: `aws s3api put-bucket-cors --bucket rapidphoto-dev --cors-configuration file://cors-config.json`
- [ ] 16. Apply CORS to prod bucket: `aws s3api put-bucket-cors --bucket rapidphoto-prod --cors-configuration file://cors-config.json`
- [ ] 17. Verify buckets created: `aws s3 ls`
- [ ] 18. Test S3 access by uploading a test file to dev bucket

### Project Structure Creation
- [ ] 19. Create root project directory: `mkdir rapidphoto && cd rapidphoto`
- [ ] 20. Initialize Git repository: `git init`
- [ ] 21. Create `.gitignore` file at root level
- [ ] 22. Add common ignore patterns to `.gitignore` (node_modules, target, .env, etc.)
- [ ] 23. Create `README.md` with project overview
- [ ] 24. Create `docker-compose.yml` at root level
- [ ] 25. Configure PostgreSQL service in docker-compose.yml (image: postgres:16, port 5432)
- [ ] 26. Add environment variables to PostgreSQL service (POSTGRES_DB, USER, PASSWORD)
- [ ] 27. Add volume mapping for PostgreSQL data persistence
- [ ] 28. Add healthcheck to PostgreSQL service
- [ ] 29. Start PostgreSQL: `docker compose up -d`
- [ ] 30. Verify PostgreSQL running: `docker compose ps`
- [ ] 31. Test PostgreSQL connection: `docker exec -it rapidphoto-postgres psql -U postgres -d rapidphoto`

---

## PR #2: Spring Boot Backend Foundation & Domain Models

### Spring Boot Project Initialization
- [ ] 1. Navigate to root directory: `cd rapidphoto`
- [ ] 2. Create backend directory: `mkdir backend && cd backend`
- [ ] 3. Generate Spring Boot project using Spring Initializr (web, websocket, data-jpa, postgresql, validation)
- [ ] 4. Extract downloaded project to `backend/` directory
- [ ] 5. Open project in IDE (IntelliJ IDEA or VS Code)
- [ ] 6. Verify `pom.xml` contains all required dependencies
- [ ] 7. Add AWS S3 SDK dependency to `pom.xml` (software.amazon.awssdk:s3:2.20.0)
- [ ] 8. Add Jakarta validation dependency if missing
- [ ] 9. Reload Maven dependencies in IDE

### Application Configuration
- [ ] 10. Create `src/main/resources/application.yml`
- [ ] 11. Configure Spring application name: `rapidphoto`
- [ ] 12. Set active profile to `dev` by default
- [ ] 13. Configure JPA settings (hibernate ddl-auto: update, show-sql: true)
- [ ] 14. Create development profile section in application.yml
- [ ] 15. Configure dev datasource URL: `jdbc:postgresql://localhost:5432/rapidphoto`
- [ ] 16. Set dev datasource username: `postgres`
- [ ] 17. Set dev datasource password: `postgres`
- [ ] 18. Add AWS S3 configuration for dev: bucket name `rapidphoto-dev`, region `us-east-1`
- [ ] 19. Set server port: 8080
- [ ] 20. Create production profile section in application.yml
- [ ] 21. Configure prod datasource with environment variable placeholders
- [ ] 22. Add AWS S3 configuration for prod: bucket name `rapidphoto-prod`
- [ ] 23. Create `application-dev.yml` for dev-specific overrides (optional)
- [ ] 24. Create `application-prod.yml` for prod-specific overrides (optional)

### Project Structure Setup
- [ ] 25. Create package: `com.rapidphoto.config`
- [ ] 26. Create package: `com.rapidphoto.domain`
- [ ] 27. Create package: `com.rapidphoto.features`
- [ ] 28. Create package: `com.rapidphoto.infrastructure`
- [ ] 29. Create subdirectory: `features/batchupload`
- [ ] 30. Create subdirectory: `features/photoquery`
- [ ] 31. Create subdirectory: `features/photocompletion`
- [ ] 32. Create subdirectory: `domain` (for shared domain models)
- [ ] 33. Create subdirectory: `infrastructure/s3`
- [ ] 34. Create subdirectory: `infrastructure/websocket`

### Domain Models (DDD)
- [ ] 35. Create `domain/UploadStatus.java` enum with values: PENDING, UPLOADING, COMPLETED, FAILED
- [ ] 36. Create `domain/PhotoId.java` as @Embeddable record with UUID field
- [ ] 37. Add static factory method `PhotoId.generate()` to create new UUIDs
- [ ] 38. Create `domain/UserId.java` as @Embeddable record with UUID field
- [ ] 39. Create `domain/Photo.java` entity class with @Entity annotation
- [ ] 40. Add @EmbeddedId PhotoId to Photo entity
- [ ] 41. Add @Embedded UserId to Photo entity
- [ ] 42. Add String fileName field to Photo
- [ ] 43. Add String s3Key field to Photo (nullable initially)
- [ ] 44. Add @Enumerated(EnumType.STRING) UploadStatus status field
- [ ] 45. Add Long fileSize field to Photo
- [ ] 46. Add String contentType field to Photo
- [ ] 47. Add LocalDateTime createdAt field with @CreationTimestamp
- [ ] 48. Add LocalDateTime uploadedAt field (nullable)
- [ ] 49. Create static factory method `Photo.createPending()` for new uploads
- [ ] 50. Add business logic method `markAsCompleted(String s3Key)` to Photo
- [ ] 51. Add business logic method `markAsFailed(String errorMessage)` to Photo
- [ ] 52. Add validation in markAsCompleted to ensure status is PENDING
- [ ] 53. Add equals() and hashCode() methods based on PhotoId
- [ ] 54. Add toString() method for debugging
- [ ] 55. Create `domain/PhotoRepository.java` interface extending JpaRepository
- [ ] 56. Add custom query method: `List<Photo> findByUserIdOrderByCreatedAtDesc(UserId userId)`
- [ ] 57. Add custom query method: `Page<Photo> findByUserId(UserId userId, Pageable pageable)`
- [ ] 58. Add custom query method: `Optional<Photo> findByIdAndUserId(PhotoId id, UserId userId)`

---

## PR #3: AWS S3 Integration & Configuration

### AWS S3 Configuration
- [ ] 1. Create `config/S3Config.java` class with @Configuration annotation
- [ ] 2. Add @Value annotation to inject AWS region from application.yml
- [ ] 3. Add @Value annotation to inject S3 bucket name from application.yml
- [ ] 4. Create @Bean method for S3Client with default credentials provider
- [ ] 5. Configure S3Client with region from properties
- [ ] 6. Add S3Client builder with proper configuration
- [ ] 7. Create S3Properties record class to hold bucket and region configuration
- [ ] 8. Add @ConfigurationProperties binding for AWS S3 properties

### S3 Service Implementation
- [ ] 9. Create `infrastructure/s3/S3Service.java` class with @Service annotation
- [ ] 10. Inject S3Client via constructor
- [ ] 11. Inject S3Properties for bucket name and region
- [ ] 12. Add SLF4J logger to S3Service
- [ ] 13. Create method `generatePresignedUploadUrl(String key, String contentType)`
- [ ] 14. Implement S3Presigner for upload URL generation
- [ ] 15. Set presigned URL expiration to 15 minutes
- [ ] 16. Configure PUT method for upload URL
- [ ] 17. Add content-type header to presigned request
- [ ] 18. Return presigned URL as String
- [ ] 19. Add error handling and logging for URL generation
- [ ] 20. Create method `generatePresignedDownloadUrl(String key)`
- [ ] 21. Implement S3Presigner for download URL generation
- [ ] 22. Set download URL expiration to 60 minutes
- [ ] 23. Configure GET method for download URL
- [ ] 24. Return download URL as String
- [ ] 25. Add error handling and logging for download URL generation
- [ ] 26. Create method `generateS3Key(UserId userId, String fileName)` for consistent key structure
- [ ] 27. Implement key format: `users/{userId}/photos/{uuid}-{fileName}`
- [ ] 28. Add method to sanitize fileName (remove special characters, spaces)
- [ ] 29. Create method `verifyObjectExists(String key)` to check if upload completed
- [ ] 30. Implement HeadObjectRequest to check S3 object existence
- [ ] 31. Return boolean indicating if object exists
- [ ] 32. Add proper exception handling for S3 operations

### S3 DTOs and Models
- [ ] 33. Create `infrastructure/s3/PresignedUrlResponse.java` record
- [ ] 34. Add fields: String presignedUrl, String s3Key, Instant expiresAt
- [ ] 35. Create `infrastructure/s3/S3UploadException.java` custom exception
- [ ] 36. Extend RuntimeException with custom message
- [ ] 37. Add constructors for different error scenarios

---

## PR #4: Virtual Threads & Async Configuration

### Async Configuration
- [ ] 1. Create `config/AsyncConfig.java` class with @Configuration annotation
- [ ] 2. Add @EnableAsync annotation to enable Spring async support
- [ ] 3. Create @Bean method `taskExecutor()` returning Executor
- [ ] 4. Check Java version is 21+ for Virtual Threads support
- [ ] 5. Use `Executors.newVirtualThreadPerTaskExecutor()` for Java 21+
- [ ] 6. Add fallback to ThreadPoolTaskExecutor for older Java versions
- [ ] 7. Configure executor bean name: "taskExecutor"
- [ ] 8. Add logging to indicate Virtual Threads are enabled
- [ ] 9. Configure uncaught exception handler for async methods
- [ ] 10. Add @Bean for AsyncUncaughtExceptionHandler

### Application Properties Enhancement
- [ ] 11. Add Spring async configuration to application.yml
- [ ] 12. Enable virtual threads: `spring.threads.virtual.enabled=true` (if Spring Boot 3.2+)
- [ ] 13. Configure thread naming pattern for debugging
- [ ] 14. Add async pool size configuration (for fallback executor)
- [ ] 15. Set queue capacity for async executor