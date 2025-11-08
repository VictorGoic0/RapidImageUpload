# Active Context: RapidPhotoUpload

## Current Status
**Phase**: Project Initialization
**Date**: Project start
**Focus**: Setting up memory bank and project structure

## Recent Changes
- Memory bank structure created
- Project brief, product context, system patterns, and tech context documented
- Cursor rules directory initialized

## Current Work Focus
1. **Environment Setup** (Tasks-1.md, PR #1)
   - Prerequisites installation (Java 21, Docker, Node.js 20, AWS CLI)
   - S3 bucket creation and CORS configuration
   - PostgreSQL Docker setup

2. **Backend Foundation** (Tasks-1.md, PR #2)
   - Spring Boot project initialization
   - Domain models (Photo, PhotoId, UserId, UploadStatus)
   - Repository setup

3. **S3 Integration** (Tasks-1.md, PR #3)
   - S3Service implementation
   - Presigned URL generation
   - S3 configuration

4. **Async Configuration** (Tasks-1.md, PR #4)
   - Virtual threads setup
   - Async executor configuration

## Next Steps (Immediate)
1. Complete environment setup checklist
2. Initialize Spring Boot backend project
3. Create domain models following DDD patterns
4. Implement S3Service with presigned URL generation
5. Configure virtual threads for async operations

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

