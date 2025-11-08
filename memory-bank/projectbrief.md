# Project Brief: RapidPhotoUpload

## Core Mission
Build a production-grade, high-performance photo upload system demonstrating architectural excellence through Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), and Vertical Slice Architecture (VSA).

## Primary Goals
1. **Performance**: Handle 100 concurrent photo uploads (2MB each) within 90 seconds
2. **Responsiveness**: Zero UI blocking during upload operations
3. **Real-Time Feedback**: Live progress updates via WebSocket with 2-second throttling
4. **Architecture**: Clean separation across Domain, Application, and Infrastructure layers
5. **Timeline**: Complete implementation in 5 days

## Key Constraints
- **File Size**: Average 2MB per photo (JPEG, PNG, WebP)
- **Concurrency**: 100 simultaneous uploads system-wide
- **Platforms**: Web (React) and Mobile (React Native/Expo)
- **Storage**: AWS S3 with presigned URLs (direct client-to-S3 uploads)
- **Database**: PostgreSQL 16 for metadata storage
- **Authentication**: MVP uses mocked user IDs; JWT post-MVP

## Success Metrics
- ✅ 100 concurrent uploads complete within 90 seconds
- ✅ Zero UI blocking during uploads
- ✅ Real-time progress updates every 2 seconds
- ✅ Clean DDD/CQRS/VSA architecture implementation
- ✅ Deployed to AWS (Elastic Beanstalk + S3 + RDS)

## Strategic Approach
- **Presigned URLs**: Eliminate backend bandwidth bottlenecks by enabling direct client-to-S3 uploads
- **WebSocket Throttling**: Reduce 10,000 progress events to ~500 via 2-second throttling
- **Virtual Threads**: Leverage Java 21 virtual threads for high concurrency
- **Vertical Slices**: Organize code by feature (batch-upload, photo-query, photo-completion) rather than technical layers

## Out of Scope (Post-MVP)
- JWT authentication (use mocked userId for MVP)
- Photo tagging system
- Advanced error recovery/retry logic
- Image compression/optimization
- Native mobile app builds (use Expo Go for MVP)

