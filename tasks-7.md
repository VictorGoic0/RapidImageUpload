# RapidPhotoUpload Tasks - Part 7: AWS Deployment & Final Testing

## PR #21: AWS RDS Setup

### RDS Instance Creation
- [x] 1. Open AWS Console and navigate to RDS
- [x] 2. Click "Create database"
- [x] 3. Select "Standard create"
- [x] 4. Choose PostgreSQL engine
- [x] 5. Select version 16.x
- [x] 6. Choose "Free tier" template (or "Production" if needed)
- [x] 7. Set DB instance identifier: `rapidphoto-prod`
- [x] 8. Set master username: `postgres`
- [x] 9. Set master password: [SECURE_PASSWORD]
- [x] 10. Confirm password
- [x] 11. Select db.t3.micro instance class (free tier eligible)
- [x] 12. Configure storage: 20 GB gp2
- [x] 13. Enable storage autoscaling (optional)
- [x] 14. Set maximum storage threshold: 100 GB
- [x] 15. Keep VPC as default
- [x] 16. Create new DB subnet group or use existing
- [x] 17. Set "Public access" to Yes (for MVP - restrict later)
- [x] 18. Create new VPC security group: `rapidphoto-db-sg`
- [x] 19. Set database name: `rapidphoto`
- [x] 20. Keep port as 5432
- [x] 21. Enable automated backups with 7-day retention
- [x] 22. Click "Create database"
- [x] 23. Wait for instance to be "Available" (5-10 minutes)

### RDS Security Configuration
- [x] 24. Navigate to RDS instance details
- [x] 25. Click on VPC security group
- [x] 26. Edit inbound rules
- [x] 27. Add rule: Type=PostgreSQL, Port=5432
- [x] 28. For MVP: Source=0.0.0.0/0 (allow all - restrict later)
- [x] 29. For production: Source=ECS security group
- [x] 30. Save rules
- [x] 31. Note RDS endpoint hostname
- [x] 32. Test connection from local machine: `psql -h [endpoint] -U postgres -d rapidphoto`
- [x] 33. Enter password and verify connection

### Database Initialization
- [x] 34. Connect to RDS from local: `psql -h [endpoint] -U postgres -d rapidphoto`
- [x] 35. Verify database created: `\l`
- [x] 36. Update application-prod.yml with RDS endpoint
- [x] 37. Set RDS_HOSTNAME environment variable placeholder
- [x] 38. Set RDS_USERNAME placeholder
- [x] 39. Set RDS_PASSWORD placeholder
- [ ] 40. Commit configuration changes

---

## PR #23: Web Frontend Deployment to Netlify

### Build Configuration
- [x] 1. Navigate to web-client: `cd web-client`
- [x] 2. Create `.env.production` file in web-client root
- [x] 3. Set VITE_API_BASE_URL to backend ECS ALB URL
- [x] 4. Set VITE_WS_URL to backend ECS ALB WebSocket URL (wss:// for production)
- [x] 5. Verify netlify.toml exists in web-client root (for SPA routing)
- [x] 6. Test production build locally: `npm run build`
- [x] 7. Verify build created in `dist/` directory
- [x] 8. Check bundle size (should be optimized)
- [x] 9. Test build locally: `npm run preview`
- [x] 10. Verify SPA routing works locally (refresh on non-home routes)

### Netlify Account & Site Setup
- [x] 11. Sign up for Netlify account at netlify.com (if needed)
- [x] 12. Login to Netlify dashboard
- [x] 13. Click "Add new site" → "Import an existing project"
- [x] 14. Connect to GitHub repository
- [x] 15. Authorize Netlify to access repository
- [x] 16. Select RapidPhotoUpload repository
- [x] 17. Configure build settings:
- [x] 18. - Base directory: `web-client`
- [x] 19. - Build command: `npm run build`
- [x] 20. - Publish directory: `web-client/dist`
- [x] 21. Click "Add environment variables"
- [x] 22. Add VITE_API_BASE_URL with backend ECS ALB URL
- [x] 23. Add VITE_WS_URL with backend WebSocket URL
- [x] 24. Click "Deploy site"

### Deployment & Verification
- [x] 25. Wait for initial deployment (2-5 minutes)
- [x] 26. View deployment logs for any errors
- [x] 27. Get Netlify site URL (e.g., https://randomname.netlify.app)
- [x] 28. Access site in browser
- [x] 29. Verify application loads correctly
- [x] 30. Test navigation between pages
- [x] 31. Refresh page on /gallery route (should not 404)
- [x] 32. Refresh page on /upload route (should not 404)
- [x] 33. Test WebSocket connection to backend
- [x] 34. Test photo upload flow end-to-end
- [x] 35. Verify CORS allows requests from Netlify domain
- [x] 36. Check browser console for errors
- [x] 37. Test on mobile device

### Custom Domain Setup (Optional)
- [x] 38. Click "Domain settings" in Netlify dashboard
- [x] 39. Click "Add custom domain"
- [x] 40. Enter your domain name
- [x] 41. Follow DNS configuration instructions
- [x] 42. Add DNS records at your domain registrar
- [x] 43. Wait for DNS propagation (up to 24 hours)
- [x] 44. Enable HTTPS (Netlify auto-provisions SSL)
- [x] 45. Verify custom domain works with HTTPS

### Continuous Deployment Setup
- [x] 46. Verify auto-deploy is enabled for main branch
- [x] 47. Make a test commit to main branch
- [x] 48. Verify Netlify automatically triggers deployment
- [x] 49. Check deployment status in Netlify dashboard
- [x] 50. Verify changes appear on live site
- [x] 51. Set up deploy notifications (optional, email or Slack)
- [x] 52. Configure branch deploys for preview (optional)

### SSL Certificate Configuration for Backend
- [x] 53. Navigate to AWS Elastic Beanstalk environment
- [x] 54. Go to Configuration → Load Balancer
- [x] 55. Add HTTPS listener on port 443
- [x] 56. Create or import SSL certificate in AWS Certificate Manager (ACM)
- [x] 57. For MVP: Use self-signed certificate (or ACM certificate)
- [x] 58. Attach certificate to Application Load Balancer (ALB)
- [x] 59. Configure security group to allow HTTPS traffic (port 443)
- [x] 60. Update backend CORS configuration to allow Netlify domain
- [x] 61. Update Netlify environment variables to use HTTPS backend URL
- [x] 62. Test WebSocket connection over WSS (secure WebSocket)
- [x] 63. Verify all API calls work over HTTPS

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
- [ ] 10. Explain S3, RDS, and ECS Fargate usage

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
- [ ] 89. ✅ Backend deployed to AWS Elastic Beanstalk (with ALB and SSL)
- [ ] 90. ✅ Web app deployed to Netlify
- [ ] 91. ✅ Mobile app working with production backend (via Expo Go)
- [ ] 92. ✅ Integration tests passing

## Summary

I've created a comprehensive task breakdown across **7 files** (tasks-1.md through tasks-7.md), organized into **25 Pull Requests** covering the complete implementation:

### File Breakdown:

**tasks-1.md** (PR #1-4): Environment setup, backend foundation, domain models, S3 integration, Virtual Threads config

**tasks-2.md** (PR #5-7): WebSocket setup, batch upload feature, photo completion feature

**tasks-3.md** (PR #8-9): Photo query feature, backend integration tests

**tasks-4.md** (PR #10-12): React project setup, API services, WebSocket hooks

**tasks-5.md** (PR #13-15): Upload components, upload page, gallery page

**tasks-6.md** (PR #16-20): React Native setup, mobile services, mobile components, mobile screens

**Note**: PR #24 (Mobile App Production Configuration) was removed as Expo app deployment is not required for MVP.

**tasks-7.md** (PR #21-23, 25-26): AWS deployment (RDS, ECS Fargate, S3), Netlify deployment, integration testing, documentation, demo

### Key Features:
- ✅ Each file is 300-450 lines
- ✅ Organized by PR with clear boundaries
- ✅ Numbered tasks within each PR
- ✅ Follows your exact format
- ✅ Checkbox format for tracking progress
- ✅ Logical progression from setup → backend → frontend → mobile → deployment → testing
- ✅ Covers all PRD requirements (DDD, CQRS, VSA, WebSocket, presigned URLs, etc.)

The task breakdown is ready for you to start implementation! Each PR builds on the previous one, and you can work through them sequentially over the 5-day timeline. Good luck with your project! 🚀