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

## PR #22: ECS Fargate Deployment

### Prerequisites
- [ ] 1. Verify Docker is installed: `docker --version`
- [ ] 2. Verify AWS CLI is configured: `aws sts get-caller-identity`
- [ ] 3. Ensure you have RDS endpoint from PR #21
- [ ] 4. Navigate to backend directory: `cd backend`

### Docker Setup
- [ ] 5. Verify Dockerfile exists in backend directory
- [ ] 6. Test Docker build locally: `docker build -t rapidphoto-backend .`
- [ ] 7. Test Docker container locally: `docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev rapidphoto-backend`
- [ ] 8. Verify application starts: `curl http://localhost:8080/actuator/health`
- [ ] 9. Stop local container: `docker stop $(docker ps -q --filter ancestor=rapidphoto-backend)`

### ECR Repository Setup
- [ ] 10. Create ECR repository: `aws ecr create-repository --repository-name rapidphoto-backend --region us-east-2`
- [ ] 11. Note repository URI from output (e.g., `123456789012.dkr.ecr.us-east-2.amazonaws.com/rapidphoto-backend`)
- [ ] 12. Login to ECR: `aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin [REPOSITORY_URI]`
- [ ] 13. Build Docker image: `docker build -t rapidphoto-backend .`
- [ ] 14. Tag image for ECR: `docker tag rapidphoto-backend:latest [REPOSITORY_URI]:latest`
- [ ] 15. Push image to ECR: `docker push [REPOSITORY_URI]:latest`

### Secrets Manager Setup
- [ ] 16. Store RDS password in Secrets Manager: `aws secretsmanager create-secret --name rapidphoto/rds/password --secret-string "[RDS_PASSWORD]" --region us-east-2`
- [ ] 17. Verify secret created: `aws secretsmanager describe-secret --secret-id rapidphoto/rds/password --region us-east-2`

### VPC and Networking Setup
- [ ] 18. Get default VPC ID: `aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-2`
- [ ] 19. Get default subnet IDs: `aws ec2 describe-subnets --filters "Name=vpc-id,Values=[VPC_ID]" --query "Subnets[*].SubnetId" --output text --region us-east-2`
- [ ] 20. Create security group for ECS tasks: `aws ec2 create-security-group --group-name rapidphoto-ecs-sg --description "Security group for RapidPhoto ECS tasks" --vpc-id [VPC_ID] --region us-east-2`
- [ ] 21. Note security group ID from output
- [ ] 22. Add inbound rule for RDS: `aws ec2 authorize-security-group-ingress --group-id [ECS_SG_ID] --protocol tcp --port 5432 --source-group [RDS_SG_ID] --region us-east-2`
- [ ] 23. Create security group for ALB: `aws ec2 create-security-group --group-name rapidphoto-alb-sg --description "Security group for RapidPhoto ALB" --vpc-id [VPC_ID] --region us-east-2`
- [ ] 24. Note ALB security group ID from output
- [ ] 25. Allow HTTP from anywhere: `aws ec2 authorize-security-group-ingress --group-id [ALB_SG_ID] --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-2`
- [ ] 26. Allow HTTPS from anywhere: `aws ec2 authorize-security-group-ingress --group-id [ALB_SG_ID] --protocol tcp --port 443 --cidr 0.0.0.0/0 --region us-east-2`
- [ ] 27. Allow ALB to communicate with ECS: `aws ec2 authorize-security-group-ingress --group-id [ECS_SG_ID] --protocol tcp --port 8080 --source-group [ALB_SG_ID] --region us-east-2`

### CloudWatch Logs Setup
- [ ] 28. Create CloudWatch log group: `aws logs create-log-group --log-group-name /ecs/rapidphoto-backend --region us-east-2`

### ECS Cluster Creation
- [ ] 29. Create ECS cluster: `aws ecs create-cluster --cluster-name rapidphoto-cluster --region us-east-2`
- [ ] 30. Verify cluster created: `aws ecs describe-clusters --clusters rapidphoto-cluster --region us-east-2`

### Task Definition Creation
- [ ] 31. Create task-definition.json file with environment variables (see template below)
- [ ] 32. Register task definition: `aws ecs register-task-definition --cli-input-json file://task-definition.json --region us-east-2`
- [ ] 33. Verify task definition: `aws ecs describe-task-definition --task-definition rapidphoto-backend --region us-east-2`

### Application Load Balancer Setup
- [ ] 34. Get subnet IDs as array: `aws ec2 describe-subnets --filters "Name=vpc-id,Values=[VPC_ID]" --query "Subnets[*].SubnetId" --output json --region us-east-2`
- [ ] 35. Create ALB: `aws elbv2 create-load-balancer --name rapidphoto-alb --subnets [SUBNET_ID_1] [SUBNET_ID_2] --security-groups [ALB_SG_ID] --region us-east-2`
- [ ] 36. Note ALB ARN from output (e.g., `arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/rapidphoto-alb/...`)
- [ ] 37. Wait for ALB to be active (check status): `aws elbv2 describe-load-balancers --load-balancer-arns [ALB_ARN] --query "LoadBalancers[0].State.Code" --region us-east-2` (should return "active")
- [ ] 38. Create target group: `aws elbv2 create-target-group --name rapidphoto-tg --protocol HTTP --port 8080 --vpc-id [VPC_ID] --target-type ip --health-check-path /actuator/health --health-check-interval-seconds 30 --health-check-timeout-seconds 5 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --region us-east-2`
- [ ] 39. Note target group ARN from output
- [ ] 40. Create HTTP listener on ALB: `aws elbv2 create-listener --load-balancer-arn [ALB_ARN] --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=[TARGET_GROUP_ARN] --region us-east-2`

### ECS Service Creation
- [ ] 41. Get subnet IDs as array format: `aws ec2 describe-subnets --filters "Name=vpc-id,Values=[VPC_ID]" --query "Subnets[*].SubnetId" --output json --region us-east-2`
- [ ] 42. Create ECS service: `aws ecs create-service --cluster rapidphoto-cluster --service-name rapidphoto-backend-service --task-definition rapidphoto-backend --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[SUBNET_ID_1,SUBNET_ID_2],securityGroups=[ECS_SG_ID],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=[TARGET_GROUP_ARN],containerName=rapidphoto-backend,containerPort=8080" --region us-east-2`
- [ ] 43. Wait for service to stabilize: `aws ecs wait services-stable --cluster rapidphoto-cluster --services rapidphoto-backend-service --region us-east-2`

### Deployment Verification
- [ ] 45. Get ALB DNS name: `aws elbv2 describe-load-balancers --load-balancer-arns [ALB_ARN] --query "LoadBalancers[0].DNSName" --output text --region us-east-2`
- [ ] 46. Test health endpoint: `curl http://[ALB_DNS_NAME]/actuator/health`
- [ ] 47. Verify response: `{"status":"UP"}`
- [ ] 48. Test WebSocket endpoint: `wscat -c ws://[ALB_DNS_NAME]/ws` (or use browser WebSocket client)
- [ ] 49. Test batch init endpoint: `curl -X POST http://[ALB_DNS_NAME]/api/photos/batch-init -H "Content-Type: application/json" -d '{"userId":"test-user","photos":[{"fileName":"test.jpg","contentType":"image/jpeg","size":2048576}]}'`
- [ ] 50. Verify S3 presigned URLs in response
- [ ] 51. Check CloudWatch logs: `aws logs tail /ecs/rapidphoto-backend --follow --region us-east-2`
- [ ] 52. Verify no errors in application logs
- [ ] 53. Check RDS connection in logs
- [ ] 54. Test photo upload flow end-to-end

### Task Definition Template
Create `task-definition.json` in backend directory:
```json
{
  "family": "rapidphoto-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "rapidphoto-backend",
      "image": "[REPOSITORY_URI]:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "SPRING_PROFILES_ACTIVE", "value": "prod"},
        {"name": "AWS_REGION", "value": "us-east-2"},
        {"name": "S3_BUCKET", "value": "rapidphoto-prod"},
        {"name": "RDS_HOSTNAME", "value": "[RDS_ENDPOINT]"},
        {"name": "RDS_PORT", "value": "5432"},
        {"name": "RDS_DB_NAME", "value": "rapidphoto"},
        {"name": "RDS_USERNAME", "value": "postgres"}
      ],
      "secrets": [
        {
          "name": "RDS_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-2:[ACCOUNT_ID]:secret:rapidphoto/rds/password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rapidphoto-backend",
          "awslogs-region": "us-east-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## PR #23: Web Frontend Deployment to S3

### Build Configuration
- [ ] 1. Navigate to web-client: `cd web-client`
- [ ] 2. Update `.env.production` with ECS ALB backend URL
- [ ] 3. Set VITE_API_BASE_URL to ECS ALB URL
- [ ] 4. Set VITE_WS_URL to ECS ALB WebSocket URL (ws:// or wss://)
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
- [ ] 26. Verify CORS allows requests to ECS ALB backend
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
- [ ] 3. Set API_URL to ECS ALB backend URL
- [ ] 4. Set WS_URL to ECS ALB WebSocket URL
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
- [ ] 89. ✅ Backend deployed to AWS ECS Fargate
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

**tasks-7.md** (PR #21-26): AWS deployment (RDS, ECS Fargate, S3), integration testing, documentation, demo

### Key Features:
- ✅ Each file is 300-450 lines
- ✅ Organized by PR with clear boundaries
- ✅ Numbered tasks within each PR
- ✅ Follows your exact format
- ✅ Checkbox format for tracking progress
- ✅ Logical progression from setup → backend → frontend → mobile → deployment → testing
- ✅ Covers all PRD requirements (DDD, CQRS, VSA, WebSocket, presigned URLs, etc.)

The task breakdown is ready for you to start implementation! Each PR builds on the previous one, and you can work through them sequentially over the 5-day timeline. Good luck with your project! 🚀