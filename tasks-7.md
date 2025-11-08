# RapidPhotoUpload Tasks - Part 7: AWS Deployment & Final Testing

## PR #21: AWS RDS Setup

### RDS Instance Creation
- [ ] 1. Open AWS Console and navigate to RDS
- [ ] 2. Click "Create database"
- [ ] 3. Select "Standard create"
- [ ] 4. Choose PostgreSQL engine
- [ ] 5. Select version 16.x
- [ ] 6. Choose "Free tier" template (or "Production" if needed)
- [ ] 7. Set DB instance identifier: `rapidphoto-prod`
- [ ] 8. Set master username: `postgres`
- [ ] 9. Set master password: [SECURE_PASSWORD]
- [ ] 10. Confirm password
- [ ] 11. Select db.t3.micro instance class (free tier eligible)
- [ ] 12. Configure storage: 20 GB gp2
- [ ] 13. Enable storage autoscaling (optional)
- [ ] 14. Set maximum storage threshold: 100 GB
- [ ] 15. Keep VPC as default
- [ ] 16. Create new DB subnet group or use existing
- [ ] 17. Set "Public access" to Yes (for MVP - restrict later)
- [ ] 18. Create new VPC security group: `rapidphoto-db-sg`
- [ ] 19. Set database name: `rapidphoto`
- [ ] 20. Keep port as 5432
- [ ] 21. Enable automated backups with 7-day retention
- [ ] 22. Click "Create database"
- [ ] 23. Wait for instance to be "Available" (5-10 minutes)

### RDS Security Configuration
- [ ] 24. Navigate to RDS instance details
- [ ] 25. Click on VPC security group
- [ ] 26. Edit inbound rules
- [ ] 27. Add rule: Type=PostgreSQL, Port=5432
- [ ] 28. For MVP: Source=0.0.0.0/0 (allow all - restrict later)
- [ ] 29. For production: Source=Elastic Beanstalk security group
- [ ] 30. Save rules
- [ ] 31. Note RDS endpoint hostname
- [ ] 32. Test connection from local machine: `psql -h [endpoint] -U postgres -d rapidphoto`
- [ ] 33. Enter password and verify connection

### Database Initialization
- [ ] 34. Connect to RDS from local: `psql -h [endpoint] -U postgres -d rapidphoto`
- [ ] 35. Verify database created: `\l`
- [ ] 36. Update application-prod.yml with RDS endpoint
- [ ] 37. Set RDS_HOSTNAME environment variable placeholder
- [ ] 38. Set RDS_USERNAME placeholder
- [ ] 39. Set RDS_PASSWORD placeholder
- [ ] 40. Commit configuration changes

---

## PR #22: Elastic Beanstalk Deployment

### EB CLI Setup
- [ ] 1. Ensure awsebcli is installed: `pip install awsebcli`
- [ ] 2. Verify installation: `eb --version`
- [ ] 3. Navigate to backend directory: `cd backend`
- [ ] 4. Initialize EB application: `eb init`
- [ ] 5. Select region: us-east-2
- [ ] 6. Create new application: rapidphoto
- [ ] 7. Select platform: Java with Corretto 21
- [ ] 8. Choose not to use CodeCommit
- [ ] 9. Choose not to setup SSH (for now)

### Application Build
- [ ] 10. Clean and package application: `./mvnw clean package -DskipTests`
- [ ] 11. Verify JAR created in target/ directory
- [ ] 12. Check JAR size (should be ~50-80MB)
- [ ] 13. Test JAR locally: `java -jar target/rapidphoto-0.0.1-SNAPSHOT.jar`
- [ ] 14. Verify application starts without errors
- [ ] 15. Stop local application

### EB Environment Creation
- [ ] 16. Create EB environment: `eb create rapidphoto-prod-env`
- [ ] 17. Select instance type: t3.micro (free tier)
- [ ] 18. Choose to enable spot fleet requests: No
- [ ] 19. Wait for environment creation (10-15 minutes)
- [ ] 20. Monitor creation logs: `eb logs`
- [ ] 21. Check for any errors during deployment

### Environment Configuration
- [ ] 22. Set environment variables: `eb setenv SPRING_PROFILES_ACTIVE=prod`
- [ ] 23. Set AWS_REGION: `eb setenv AWS_REGION=us-east-2`
- [ ] 24. Set S3_BUCKET: `eb setenv S3_BUCKET=rapidphoto-prod`
- [ ] 25. Set RDS_HOSTNAME: `eb setenv RDS_HOSTNAME=[rds-endpoint]`
- [ ] 26. Set RDS_PORT: `eb setenv RDS_PORT=5432`
- [ ] 27. Set RDS_DB_NAME: `eb setenv RDS_DB_NAME=rapidphoto`
- [ ] 28. Set RDS_USERNAME: `eb setenv RDS_USERNAME=postgres`
- [ ] 29. Set RDS_PASSWORD: `eb setenv RDS_PASSWORD=[secure-password]`
- [ ] 30. Verify environment variables: `eb printenv`

### Deployment Verification
- [ ] 31. Get EB application URL: `eb open`
- [ ] 32. Access health check: curl [eb-url]/actuator/health
- [ ] 33. Verify response: {"status":"UP"}
- [ ] 34. Test WebSocket endpoint: ws://[eb-url]/ws
- [ ] 35. Test batch init endpoint with Postman
- [ ] 36. Verify S3 presigned URLs generated correctly
- [ ] 37. Test photo upload flow end-to-end
- [ ] 38. Check CloudWatch logs: `eb logs`
- [ ] 39. Verify no errors in application logs
- [ ] 40. Check RDS connection in logs

### EB Configuration Files (Optional Enhancement)
- [ ] 41. Create `.ebextensions/` directory in backend root
- [ ] 42. Create `01_nginx.config` for WebSocket support
- [ ] 43. Configure nginx to proxy WebSocket connections
- [ ] 44. Create `02_cloudwatch.config` for enhanced logging
- [ ] 45. Commit .ebextensions to repository
- [ ] 46. Redeploy: `eb deploy`

---

## PR #23: Web Frontend Deployment to S3

### Build Configuration
- [ ] 1. Navigate to web-client: `cd web-client`
- [ ] 2. Update `.env.production` with EB backend URL
- [ ] 3. Set VITE_API_BASE_URL to EB application URL
- [ ] 4. Set VITE_WS_URL to EB WebSocket URL (ws:// or wss://)
- [ ] 5. Build production bundle: `npm run build`
- [ ] 6. Verify build created in `dist/` directory
- [ ] 7. Check bundle size (should be optimized)
- [ ] 8. Test build locally: `npm run preview`

### S3 Static Hosting Setup
- [ ] 9. Create S3 bucket for web hosting: `aws s3 mb s3://rapidphoto-web-prod`
- [ ] 10. Enable static website hosting on bucket
- [ ] 11. Configure index document: `index.html`
- [ ] 12. Configure error document: `index.html` (for SPA routing)
- [ ] 13. Make bucket public with bucket policy
- [ ] 14. Create bucket policy JSON for public read access
- [ ] 15. Apply bucket policy: `aws s3api put-bucket-policy --bucket rapidphoto-web-prod --policy file://policy.json`
- [ ] 16. Disable "Block all public access" settings

### Upload Build Files
- [ ] 17. Sync build to S3: `aws s3 sync dist/ s3://rapidphoto-web-prod --delete`
- [ ] 18. Set cache-control headers for assets: `aws s3 cp dist/assets/ s3://rapidphoto-web-prod/assets/ --recursive --cache-control "max-age=31536000"`
- [ ] 19. Set no-cache for HTML: `aws s3 cp dist/index.html s3://rapidphoto-web-prod/index.html --cache-control "no-cache"`
- [ ] 20. Verify files uploaded: `aws s3 ls s3://rapidphoto-web-prod`

### Website Access Test
- [ ] 21. Get S3 website URL from bucket properties
- [ ] 22. Access URL in browser: `http://rapidphoto-web-prod.s3-website-us-east-2.amazonaws.com`
- [ ] 23. Verify application loads correctly
- [ ] 24. Test WebSocket connection to backend
- [ ] 25. Test photo upload flow end-to-end
- [ ] 26. Verify CORS allows requests to EB backend
- [ ] 27. Check browser console for errors

### CloudFront Setup (Optional - HTTPS)
- [ ] 28. Create CloudFront distribution for S3 bucket
- [ ] 29. Set origin to S3 website endpoint
- [ ] 30. Configure default cache behavior
- [ ] 31. Enable HTTPS only
- [ ] 32. Request SSL certificate via ACM (if custom domain)
- [ ] 33. Wait for distribution deployment (15-20 minutes)
- [ ] 34. Test CloudFront URL
- [ ] 35. Update DNS (if using custom domain)
- [ ] 36. Create invalidation for /* to clear cache

---

## PR #24: Mobile App Production Configuration

### Production API Configuration
- [ ] 1. Navigate to mobile-client: `cd mobile-client`
- [ ] 2. Update `.env` with production URLs
- [ ] 3. Set API_URL to EB backend URL
- [ ] 4. Set WS_URL to EB WebSocket URL
- [ ] 5. Test app with Expo Go: `npx expo start`
- [ ] 6. Scan QR code on physical device
- [ ] 7. Verify connection to production backend
- [ ] 8. Test upload flow with production S3
- [ ] 9. Test gallery loading with production data

### Expo Build Configuration (Optional)
- [ ] 10. Create Expo account (if needed)
- [ ] 11. Login: `npx expo login`
- [ ] 12. Configure app.json for builds
- [ ] 13. Set version and build number
- [ ] 14. Build for iOS: `eas build --platform ios` (requires Apple Developer account)
- [ ] 15. Build for Android: `eas build --platform android`
- [ ] 16. Wait for build completion (20-30 minutes)
- [ ] 17. Download and test built APK/IPA

### App Store Submission (Optional - Beyond MVP)
- [ ] 18. Prepare app store assets (screenshots, descriptions)
- [ ] 19. Submit to Apple App Store Connect
- [ ] 20. Submit to Google Play Console
- [ ] 21. Wait for review approval

---

## PR #25: Integration Testing & Quality Assurance

### Backend Integration Tests
- [ ] 1. Navigate to backend: `cd backend`
- [ ] 2. Run all tests: `./mvnw test`
- [ ] 3. Verify all tests pass
- [ ] 4. Check test coverage (aim for >70%)
- [ ] 5. Run integration tests: `./mvnw verify`
- [ ] 6. Review test reports in target/surefire-reports/

### End-to-End Testing
- [ ] 7. Test single user uploading 100 photos (web)
- [ ] 8. Measure time to completion (should be <90 seconds)
- [ ] 9. Verify all 100 photos show in gallery
- [ ] 10. Test 10 concurrent users uploading 10 photos each
- [ ] 11. Monitor backend logs for errors
- [ ] 12. Check database for correct record count
- [ ] 13. Verify all photos in S3 bucket
- [ ] 14. Test WebSocket progress updates during upload
- [ ] 15. Verify throttling working (not overwhelming backend)
- [ ] 16. Test gallery pagination (page through results)
- [ ] 17. Test photo download from gallery
- [ ] 18. Test mobile app upload flow
- [ ] 19. Verify progress syncing between web and mobile
- [ ] 20. Test error handling (network failure, S3 timeout)

### Performance Testing
- [ ] 21. Use browser DevTools to measure upload performance
- [ ] 22. Verify UI remains responsive during uploads
- [ ] 23. Check memory usage (should not grow unbounded)
- [ ] 24. Monitor CPU usage during uploads
- [ ] 25. Test on slow 3G network (throttle in DevTools)
- [ ] 26. Verify graceful degradation on slow connections
- [ ] 27. Test WebSocket reconnection after disconnect
- [ ] 28. Measure backend API response times
- [ ] 29. Check database query performance
- [ ] 30. Monitor RDS metrics in CloudWatch

### Cross-Platform Testing
- [ ] 31. Test web app in Chrome
- [ ] 32. Test web app in Firefox
- [ ] 33. Test web app in Safari
- [ ] 34. Test web app in Edge
- [ ] 35. Test mobile app on iOS simulator
- [ ] 36. Test mobile app on Android emulator
- [ ] 37. Test mobile app on physical iOS device
- [ ] 38. Test mobile app on physical Android device
- [ ] 39. Verify consistent behavior across platforms

### Security Testing
- [ ] 40. Verify presigned URLs expire after 15 minutes
- [ ] 41. Test that expired URLs return 403 Forbidden
- [ ] 42. Verify S3 bucket is not publicly listable
- [ ] 43. Check that direct S3 access requires presigned URL
- [ ] 44. Verify database credentials are not exposed
- [ ] 45. Check for sensitive data in logs
- [ ] 46. Verify CORS only allows intended origins
- [ ] 47. Test SQL injection resistance (JPA should protect)
- [ ] 48. Verify input validation on all endpoints

---

## PR #26: Documentation & Demo Preparation

### Technical Documentation
- [ ] 1. Create `ARCHITECTURE.md` in root directory
- [ ] 2. Document presigned URL strategy and rationale
- [ ] 3. Explain WebSocket throttling implementation
- [ ] 4. Document DDD domain model structure
- [ ] 5. Explain CQRS command/query separation
- [ ] 6. Document VSA feature organization
- [ ] 7. Describe Virtual Threads concurrency approach
- [ ] 8. Add architecture diagrams (draw.io or similar)
- [ ] 9. Document technology choices and trade-offs
- [ ] 10. Explain S3, RDS, and Elastic Beanstalk usage

### Setup Instructions
- [ ] 11. Update root `README.md` with project overview
- [ ] 12. Add prerequisites section (Java, Docker, Node, AWS CLI)
- [ ] 13. Document local development setup steps
- [ ] 14. Add S3 bucket creation commands
- [ ] 15. Document PostgreSQL Docker setup
- [ ] 16. Add backend startup instructions
- [ ] 17. Add web client startup instructions
- [ ] 18. Add mobile client startup instructions
- [ ] 19. Document environment variable configuration
- [ ] 20. Add deployment instructions for AWS

### AI Tool Documentation
- [ ] 21. Create `AI_TOOLS.md` document
- [ ] 22. List AI tools used (Cursor, Copilot, ChatGPT, etc.)
- [ ] 23. Document example prompts used
- [ ] 24. Example: "Create Spring Boot controller with CQRS pattern"
- [ ] 25. Example: "Generate React component for drag-drop file upload"
- [ ] 26. Example: "Write integration test for WebSocket progress updates"
- [ ] 27. Document time saved using AI (estimate 30-40%)
- [ ] 28. Explain impact on code quality and speed
- [ ] 29. Note areas where AI was most helpful
- [ ] 30. Note areas where manual refinement was needed

### Demo Video Preparation
- [ ] 31. Plan demo video structure (5-7 minutes)
- [ ] 32. Prepare script or talking points
- [ ] 33. Section 1: Project overview (30 seconds)
- [ ] 34. Section 2: Web demo (2 minutes)
- [ ] 35. Section 3: Mobile demo (2 minutes)
- [ ] 36. Section 4: Architecture walkthrough (1 minute)
- [ ] 37. Section 5: Concurrency test (1 minute)
- [ ] 38. Section 6: Conclusion (30 seconds)
- [ ] 39. Set up screen recording software (OBS, Loom, etc.)
- [ ] 40. Prepare test data (100 sample photos)

### Demo Video Recording
- [ ] 41. Record introduction and project overview
- [ ] 42. Record web app demo:
- [ ] 43. - Show upload page
- [ ] 44. - Drag and drop 20 photos
- [ ] 45. - Show real-time progress bars
- [ ] 46. - Navigate to gallery while uploading
- [ ] 47. - Show completed uploads in gallery
- [ ] 48. - Download a photo
- [ ] 49. Record mobile app demo:
- [ ] 50. - Show upload screen
- [ ] 51. - Select photos from gallery
- [ ] 52. - Show progress tracking
- [ ] 53. - Switch to gallery tab
- [ ] 54. - Show progress syncing across devices
- [ ] 55. Record architecture walkthrough:
- [ ] 56. - Show project structure (VSA)
- [ ] 57. - Highlight DDD domain models
- [ ] 58. - Show CQRS command/query handlers
- [ ] 59. - Explain WebSocket throttling code
- [ ] 60. Record concurrency test:
- [ ] 61. - Upload 100 photos simultaneously
- [ ] 62. - Show completion time (<90 seconds)
- [ ] 63. - Show all photos in gallery
- [ ] 64. Record conclusion and key achievements
- [ ] 65. Edit video for clarity and pacing
- [ ] 66. Add captions or annotations if needed
- [ ] 67. Export video in high quality
- [ ] 68. Upload to YouTube or Loom
- [ ] 69. Get shareable link
- [ ] 70. Add video link to README

### Final Repository Cleanup
- [ ] 71. Remove any debug code or console.logs
- [ ] 72. Remove unused dependencies from package.json
- [ ] 73. Remove unused imports from source files
- [ ] 74. Format all code (Prettier for JS/TS, Google Java Format)
- [ ] 75. Run linters and fix warnings
- [ ] 76. Remove .env files (keep .env.example)
- [ ] 77. Update .gitignore to exclude sensitive files
- [ ] 78. Add LICENSE file (MIT or appropriate)
- [ ] 79. Add CONTRIBUTING.md if accepting contributions
- [ ] 80. Tag release: `git tag v1.0.0`
- [ ] 81. Push all commits and tags to GitHub
- [ ] 82. Verify repository is clean and professional

### Submission Checklist
- [ ] 83. ✅ Code repository on GitHub (public or private)
- [ ] 84. ✅ README with setup instructions
- [ ] 85. ✅ ARCHITECTURE.md with technical writeup
- [ ] 86. ✅ AI_TOOLS.md with prompts and impact
- [ ] 87. ✅ Demo video uploaded and linked
- [ ] 88. ✅ All three applications (backend, web, mobile) working
- [ ] 89. ✅ Backend deployed to AWS Elastic Beanstalk
- [ ] 90. ✅ Web app deployed to S3
- [ ] 91. ✅ Mobile app working with production backend
- [ ] 92. ✅ Integration tests passing

## Summary

I've created a comprehensive task breakdown across **7 files** (tasks-1.md through tasks-7.md), organized into **26 Pull Requests** covering the complete implementation:

### File Breakdown:

**tasks-1.md** (PR #1-4): Environment setup, backend foundation, domain models, S3 integration, Virtual Threads config

**tasks-2.md** (PR #5-7): WebSocket setup, batch upload feature, photo completion feature

**tasks-3.md** (PR #8-9): Photo query feature, backend integration tests

**tasks-4.md** (PR #10-12): React project setup, API services, WebSocket hooks

**tasks-5.md** (PR #13-15): Upload components, upload page, gallery page

**tasks-6.md** (PR #16-20): React Native setup, mobile services, mobile components, mobile screens

**tasks-7.md** (PR #21-26): AWS deployment (RDS, Elastic Beanstalk, S3), integration testing, documentation, demo

### Key Features:
- ✅ Each file is 300-450 lines
- ✅ Organized by PR with clear boundaries
- ✅ Numbered tasks within each PR
- ✅ Follows your exact format
- ✅ Checkbox format for tracking progress
- ✅ Logical progression from setup → backend → frontend → mobile → deployment → testing
- ✅ Covers all PRD requirements (DDD, CQRS, VSA, WebSocket, presigned URLs, etc.)

The task breakdown is ready for you to start implementation! Each PR builds on the previous one, and you can work through them sequentially over the 5-day timeline. Good luck with your project! 🚀