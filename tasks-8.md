# RapidPhotoUpload Tasks - Part 8: Elastic Beanstalk Deployment (Simplified)

## PR #23: Elastic Beanstalk Deployment with Existing RDS

### Prerequisites & Gotcha Prevention
- [x] 1. Verify RDS instance exists and is "Available" status in AWS Console
- [x] 2. Note RDS endpoint hostname (e.g., rapidphoto.xxxxx.us-east-1.rds.amazonaws.com)
- [x] 3. Note RDS port (default: 5432)
- [x] 4. Note RDS database name (e.g., rapidphoto)
- [x] 5. Note RDS master username (e.g., postgres)
- [x] 6. Have RDS master password ready (you'll need it multiple times)
- [x] 7. Note RDS VPC ID from RDS instance details page
- [x] 8. Note RDS security group ID from RDS instance details → Connectivity & security
- [x] 9. Verify EB CLI installed: `eb --version` (if not: `pip install awsebcli`)
- [x] 10. Verify AWS CLI configured: `aws sts get-caller-identity` (should show your account)

### Spring Boot Configuration Changes (CRITICAL - Port 5000)

**GOTCHA #1: Elastic Beanstalk Expects Port 5000, NOT 8080**
- [x] 11. Open `backend/src/main/resources/application.yml`
- [x] 12. Find or add server configuration section
- [x] 13. Set server port to 5000:
```yaml
server:
  port: 5000
```
- [x] 14. Save file
- [x] 15. **VERIFY THIS IS SET** - This is the #1 cause of EB deployment failures
- [ ] 16. Commit change: `git add application.yml && git commit -m "Set port 5000 for EB"`

**GOTCHA #2: Environment Variables Must Be Used (No Hardcoded Values)**
- [x] 17. In same `application.yml` file, update datasource configuration:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${RDS_HOSTNAME}:${RDS_PORT:5432}/${RDS_DB_NAME}
    username: ${RDS_USERNAME}
    password: ${RDS_PASSWORD}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: false

aws:
  s3:
    bucket: ${S3_BUCKET}
    region: ${AWS_REGION}
```
- [x] 18. Remove any `-dev` or `-prod` profile sections that override these values
- [x] 19. Remove any hardcoded localhost, postgres, or development values
- [x] 20. Save file
- [ ] 21. Commit: `git add application.yml && git commit -m "Use environment variables for RDS"`

### Build Application JAR (REQUIRED BEFORE EB INIT)

**CRITICAL: You MUST build the JAR before initializing Elastic Beanstalk**

- [ ] 22. Navigate to backend directory: `cd backend`
- [ ] 23. Clean previous builds: `./mvnw clean`
- [ ] 24. Package application: `./mvnw package -DskipTests`
- [ ] 25. Verify JAR created: `ls -lh target/*.jar`
- [ ] 26. Check JAR size is 50-100 MB (if < 10MB, dependencies are missing)
- [ ] 27. Note the JAR filename (e.g., rapidphoto-backend-1.0.0.jar or rapidphoto-0.0.1-SNAPSHOT.jar)
- [ ] 28. **VERIFY BUILD SUCCESS** - If build fails, fix errors before proceeding to EB initialization

### Test JAR Locally (RECOMMENDED - Before EB Deployment)

**GOTCHA #3: Always Test JAR Locally Before Deploying**
- [ ] 29. Set environment variables in terminal:
```bash
export RDS_HOSTNAME=localhost
export RDS_PORT=5432
export RDS_DB_NAME=rapidphoto
export RDS_USERNAME=postgres
export RDS_PASSWORD=postgres
export S3_BUCKET=rapidphoto-dev
export AWS_REGION=us-east-1
```
- [ ] 30. Start local PostgreSQL: `docker compose up -d postgres`
- [ ] 31. Run JAR: `java -jar target/rapidphoto-*.jar`
- [ ] 32. Wait for "Started RapidPhotoApplication" message
- [ ] 33. Test health endpoint: `curl http://localhost:5000/actuator/health`
- [ ] 34. Should return: `{"status":"UP"}`
- [ ] 35. If fails, fix errors before continuing (check port, database connection)
- [ ] 36. Stop application: Press Ctrl+C
- [ ] 37. Unset environment variables: `unset RDS_HOSTNAME RDS_PORT ...` (or close terminal)

### Initialize Elastic Beanstalk (AFTER BUILD COMPLETE)

**IMPORTANT: Do not proceed until JAR build is successful (steps 22-28)**

- [ ] 38. Ensure you're in backend directory: `pwd` (should end in /backend)
- [ ] 39. Initialize EB: `eb init`
- [ ] 40. **Select region:** Choose the SAME region as your RDS instance (e.g., us-east-1)
- [ ] 41. **Application name:** Enter `rapidphoto`
- [ ] 42. **Platform:** Select `Java with Corretto 21`
- [ ] 43. **Platform branch:** Accept default (latest Corretto 21)
- [ ] 44. **CodeCommit:** Select `n` (no)
- [ ] 45. **SSH:** Select `n` (no, we'll enable later if needed)
- [ ] 46. Verify `.elasticbeanstalk/config.yml` created
- [ ] 47. Check contents: `cat .elasticbeanstalk/config.yml`
- [ ] 48. Should show: application_name: rapidphoto, platform: Corretto 21, region: us-east-1

### Create Elastic Beanstalk Environment

**GOTCHA #4: Environment Creation Takes 10-15 Minutes**
- [ ] 49. Create environment: `eb create rapidphoto-prod-env`
- [ ] 50. **Environment name:** Press Enter to accept `rapidphoto-prod-env`
- [ ] 51. **DNS CNAME:** Press Enter to accept default
- [ ] 52. **Load balancer type:** Select `2) application` (for WebSocket support)
- [ ] 53. **Spot Fleet:** Select `n` (no, use on-demand for reliability)
- [ ] 54. Wait for environment creation (10-15 minutes - go get coffee ☕)
- [ ] 55. Watch for "Successfully launched environment: rapidphoto-prod-env"
- [ ] 56. If creation fails, check: `eb logs` for error details
- [ ] 57. Common failure: Timeout waiting for health (we'll fix with security groups)

### Get EB Instance Security Group

**GOTCHA #5: Must Allow EB to Connect to RDS**
- [ ] 58. Get environment details: `eb status`
- [ ] 59. Note the environment name and CNAME
- [ ] 60. Get environment resources:
```bash
aws elasticbeanstalk describe-environment-resources \
  --environment-name rapidphoto-prod-env \
  --region us-east-1
```
- [ ] 61. Find "Instances" section in JSON output
- [ ] 62. Copy first instance ID (looks like: i-0123456789abcdef0)
- [ ] 63. Get instance security group:
```bash
aws ec2 describe-instances \
  --instance-ids [paste-instance-id-here] \
  --region us-east-1 \
  --query "Reservations[0].Instances[0].SecurityGroups[*].GroupId"
```
- [ ] 64. Copy security group ID from output (looks like: sg-0123456789abcdef0)
- [ ] 65. This is your EB security group - save it

### Configure RDS Security Group to Allow EB Access

**GOTCHA #6: This is Why "Connection Refused" Happens**
- [ ] 66. Go to AWS Console → RDS → Your database instance
- [ ] 67. Click on "Connectivity & security" tab
- [ ] 68. Under "Security", click the VPC security group link (opens in new tab)
- [ ] 69. Click "Edit inbound rules" button
- [ ] 70. Click "Add rule" button
- [ ] 71. **Type:** Select "PostgreSQL" (auto-fills port 5432)
- [ ] 72. **Source:** Select "Custom"
- [ ] 73. Paste EB security group ID from step 64
- [ ] 74. **Description:** Enter "Allow EB access"
- [ ] 75. Click "Save rules"
- [ ] 76. Verify new rule appears in inbound rules list
- [ ] 77. Verify shows: Type=PostgreSQL, Port=5432, Source=[your EB security group]

**Alternative: Use AWS CLI**
- [ ] 78. Or add rule via CLI:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id [your-rds-security-group-id] \
  --protocol tcp \
  --port 5432 \
  --source-group [your-eb-security-group-id] \
  --region us-east-1
```

### Set Environment Variables in EB

**GOTCHA #7: ALL Variables Must Be Set Before App Works**
- [ ] 79. Set RDS hostname:
```bash
eb setenv RDS_HOSTNAME=rapidphoto.xxxxx.us-east-1.rds.amazonaws.com
```
- [ ] 80. Replace with YOUR actual RDS endpoint
- [ ] 81. Set RDS port: `eb setenv RDS_PORT=5432`
- [ ] 82. Set database name: `eb setenv RDS_DB_NAME=rapidphoto`
- [ ] 83. Set username: `eb setenv RDS_USERNAME=postgres`
- [ ] 84. Set password: `eb setenv RDS_PASSWORD=your-actual-password`
- [ ] 85. Replace with YOUR actual RDS password
- [ ] 86. Set S3 bucket: `eb setenv S3_BUCKET=rapidphoto-prod`
- [ ] 87. Set AWS region: `eb setenv AWS_REGION=us-east-1`
- [ ] 88. Verify all variables: `eb printenv`
- [ ] 89. Confirm output shows all 7 variables (RDS_HOSTNAME, RDS_PORT, RDS_DB_NAME, RDS_USERNAME, RDS_PASSWORD, S3_BUCKET, AWS_REGION)
- [ ] 90. Wait 2-3 minutes for environment to update

### Deploy Application to EB

- [ ] 91. Rebuild JAR to ensure latest code: `./mvnw clean package -DskipTests`
- [ ] 92. Deploy to EB: `eb deploy`
- [ ] 93. Wait for deployment (5-10 minutes)
- [ ] 94. Watch console for "Successfully deployed" message
- [ ] 95. Check status: `eb status`
- [ ] 96. Should show "Health: Green" and "Status: Ready"
- [ ] 97. If health is Yellow or Red, continue to troubleshooting section

### Verify Application Health

- [ ] 98. Get environment URL: `eb status | grep CNAME`
- [ ] 99. Copy the URL (e.g., rapidphoto-prod-env.us-east-1.elasticbeanstalk.com)
- [ ] 100. Test health endpoint: `curl http://[your-url]/actuator/health`
- [ ] 101. Should return: `{"status":"UP"}`
- [ ] 102. If returns error, check: `eb logs`
- [ ] 103. Open in browser: `eb open`
- [ ] 104. Navigate to: `http://[your-url]/actuator/health` in browser
- [ ] 105. Should see JSON response with status UP

### Test API Endpoints

- [ ] 106. Test batch upload init endpoint:
```bash
curl -X POST http://[your-eb-url]/api/photos/batch-init \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "photos": [
      {
        "fileName": "test.jpg",
        "contentType": "image/jpeg",
        "size": 2048576
      }
    ]
  }'
```
- [ ] 107. Should return 201 Created
- [ ] 108. Should include presignedUrl in response
- [ ] 109. Verify presigned URL points to S3: rapidphoto-prod bucket
- [ ] 110. Check logs for errors: `eb logs`
- [ ] 111. Look for "HikariPool" messages indicating successful DB connection

### Configure WebSocket Support (Nginx Proxy)

**GOTCHA #8: EB Load Balancer Doesn't Support WebSocket by Default**
- [ ] 112. Create extensions directory: `mkdir -p .ebextensions`
- [ ] 113. Create WebSocket config file: `touch .ebextensions/01_websocket.config`
- [ ] 114. Open file in editor: `nano .ebextensions/01_websocket.config`
- [ ] 115. Paste configuration:
```yaml
files:
  "/etc/nginx/conf.d/websocket_upgrade.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      upstream springboot {
        server 127.0.0.1:5000;
        keepalive 256;
      }

      server {
        listen 80;

        location /ws {
          proxy_pass http://springboot;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_read_timeout 86400;
        }

        location / {
          proxy_pass http://springboot;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
        }
      }

container_commands:
  01_reload_nginx:
    command: "sudo service nginx reload"
```
- [ ] 116. Save file (Ctrl+O, Enter, Ctrl+X in nano)
- [ ] 117. Verify file created: `cat .ebextensions/01_websocket.config`
- [ ] 118. Add to git: `git add .ebextensions/`
- [ ] 119. Commit: `git commit -m "Add WebSocket nginx configuration"`
- [ ] 120. Deploy with WebSocket support: `eb deploy`
- [ ] 121. Wait for deployment (5-10 minutes)

### Test WebSocket Connection

- [ ] 122. Install wscat for testing: `npm install -g wscat`
- [ ] 123. Test WebSocket: `wscat -c ws://[your-eb-url]/ws`
- [ ] 124. Should see: "Connected (press CTRL+C to quit)"
- [ ] 125. If connection refused, check nginx config deployed
- [ ] 126. SSH into instance: `eb ssh` (if you enabled SSH)
- [ ] 127. Check nginx config: `sudo cat /etc/nginx/conf.d/websocket_upgrade.conf`
- [ ] 128. Should see your WebSocket configuration
- [ ] 129. Test nginx syntax: `sudo nginx -t`
- [ ] 130. Should show: "syntax is ok" and "test is successful"
- [ ] 131. Exit SSH: `exit`

**Alternative: Test with Browser Console**
- [ ] 132. Open browser DevTools console
- [ ] 133. Run:
```javascript
const ws = new WebSocket('ws://[your-eb-url]/ws');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
ws.onclose = () => console.log('WebSocket closed');
```
- [ ] 134. Should see "✅ WebSocket connected" in console
- [ ] 135. If error, nginx config may not be applied

### Configure IAM Role for S3 Access

**GOTCHA #9: EB Instance Needs Permission to Access S3**
- [ ] 136. Go to AWS Console → Elastic Beanstalk
- [ ] 137. Click on your environment: rapidphoto-prod-env
- [ ] 138. Click "Configuration" in left sidebar
- [ ] 139. Find "Security" section, click "Edit"
- [ ] 140. Note the "IAM instance profile" (e.g., aws-elasticbeanstalk-ec2-role)
- [ ] 141. Open new tab: AWS Console → IAM → Roles
- [ ] 142. Search for the role name from step 140
- [ ] 143. Click on the role
- [ ] 144. Click "Attach policies" button
- [ ] 145. Search for "AmazonS3FullAccess"
- [ ] 146. Check the box next to AmazonS3FullAccess
- [ ] 147. Click "Attach policy" button
- [ ] 148. Verify policy appears in role's permissions
- [ ] 149. Go back to EB console, click "Apply" (no changes needed, just confirming)
- [ ] 150. Wait for environment update (2-3 minutes)

### Update Frontend Applications

**Web Client Configuration**
- [ ] 151. Navigate to web-client: `cd ../web-client`
- [ ] 152. Create or update `.env.production`:
```
VITE_API_BASE_URL=http://rapidphoto-prod-env.us-east-1.elasticbeanstalk.com
VITE_WS_URL=ws://rapidphoto-prod-env.us-east-1.elasticbeanstalk.com/ws
```
- [ ] 153. Replace with YOUR actual EB environment URL
- [ ] 154. Save file
- [ ] 155. Build production bundle: `npm run build`
- [ ] 156. Test locally: `npm run preview`
- [ ] 157. Open browser to preview URL (usually http://localhost:4173)
- [ ] 158. Test upload flow - should connect to EB backend
- [ ] 159. Check browser console for errors
- [ ] 160. Verify presigned URLs are generated
- [ ] 161. Verify WebSocket connects (look for connection message in console)

**Mobile Client Configuration**
- [ ] 162. Navigate to mobile-client: `cd ../mobile-client`
- [ ] 163. Update `.env`:
```
API_URL=http://rapidphoto-prod-env.us-east-1.elasticbeanstalk.com
WS_URL=ws://rapidphoto-prod-env.us-east-1.elasticbeanstalk.com/ws
```
- [ ] 164. Replace with YOUR actual EB environment URL
- [ ] 165. Save file
- [ ] 166. Start Expo: `npx expo start`
- [ ] 167. Scan QR code on mobile device
- [ ] 168. Test upload flow
- [ ] 169. Verify connects to production backend
- [ ] 170. Check Expo logs for connection errors

### End-to-End Testing

- [ ] 171. Test web app: Upload 10 photos
- [ ] 172. Verify progress bars update in real-time
- [ ] 173. Verify all photos show as COMPLETED
- [ ] 174. Check gallery page - all 10 photos should appear
- [ ] 175. Download a photo - should work
- [ ] 176. Test mobile app: Upload 5 photos
- [ ] 177. Verify progress updates
- [ ] 178. Check gallery on mobile
- [ ] 179. Verify progress syncs between web and mobile (open both, upload on one, watch other)
- [ ] 180. Check EB logs: `eb logs`
- [ ] 181. Verify no errors in application logs

### Troubleshooting Common Issues

**Issue: Health Check Fails (Degraded/Severe)**
- [ ] 182. Check logs: `eb logs`
- [ ] 183. Look for error: "Connection refused"
  - Fix: Verify server.port=5000 in application.yml
  - Rebuild and redeploy: `./mvnw clean package && eb deploy`
- [ ] 184. Look for error: "Application error"
  - Check full stack trace in logs
  - Common: Missing environment variables
  - Verify: `eb printenv` shows all 7 variables
- [ ] 185. Check health: `eb health --refresh`
- [ ] 186. If still failing, check CloudWatch logs in AWS Console

**Issue: Database Connection Fails**
- [ ] 187. Verify environment variables: `eb printenv`
- [ ] 188. Check RDS_HOSTNAME is correct (no http://, no trailing slash)
- [ ] 189. Verify RDS security group has EB security group in inbound rules
- [ ] 190. Test from EB instance (if SSH enabled):
```bash
eb ssh
psql -h [rds-endpoint] -U postgres -d rapidphoto
```
- [ ] 191. If "connection refused": Security group issue
- [ ] 192. If "password authentication failed": Wrong RDS_PASSWORD environment variable
- [ ] 193. Exit SSH: `exit`

**Issue: S3 Upload Fails (403 Forbidden)**
- [ ] 194. Verify S3 bucket exists: `aws s3 ls s3://rapidphoto-prod`
- [ ] 195. Check EB instance IAM role has S3 permissions (step 136-150)
- [ ] 196. Test presigned URL generation in logs
- [ ] 197. Verify AWS_REGION matches S3 bucket region
- [ ] 198. Check S3 bucket CORS configuration:
```bash
aws s3api get-bucket-cors --bucket rapidphoto-prod
```
- [ ] 199. If no CORS, add it (as in PR #1 tasks)

**Issue: WebSocket Not Connecting**
- [ ] 200. Verify .ebextensions/01_websocket.config exists
- [ ] 201. Check file was deployed: `eb ssh` then `sudo cat /etc/nginx/conf.d/websocket_upgrade.conf`
- [ ] 202. If file missing, redeploy: `eb deploy`
- [ ] 203. Test nginx config: `sudo nginx -t`
- [ ] 204. Reload nginx: `sudo service nginx reload`
- [ ] 205. Check nginx error log: `sudo tail -100 /var/log/nginx/error.log`
- [ ] 206. Exit SSH: `exit`

**Issue: Slow Performance**
- [ ] 207. Check instance type: `eb status`
- [ ] 208. If t3.micro, consider upgrading to t3.small for better performance
- [ ] 209. Check RDS instance class (db.t3.micro may be slow under load)
- [ ] 210. Monitor CloudWatch metrics for CPU/memory usage
- [ ] 211. Consider enabling auto-scaling if needed

### Monitoring and Maintenance

- [ ] 212. Enable enhanced health reporting: Already enabled by default
- [ ] 213. Check environment health: `eb health`
- [ ] 214. Stream logs in real-time: `eb logs --stream`
- [ ] 215. Set up CloudWatch alarms (optional):
  - Environment health degraded
  - High CPU (>80%)
  - High memory (>80%)
- [ ] 216. Monitor costs in AWS Billing Dashboard
- [ ] 217. Typical monthly cost: $15-30 (t3.micro EB + existing RDS)

### Cleanup Commands (For Reference)

**If you need to tear down and start over:**
- [ ] 218. Terminate environment: `eb terminate rapidphoto-prod-env`
- [ ] 219. Wait for termination (5-10 minutes)
- [ ] 220. Delete application: `eb terminate --all`
- [ ] 221. Clean local EB config: `rm -rf .elasticbeanstalk/`
- [ ] 222. RDS will remain (you're reusing existing one)

### Final Deployment Checklist

- [ ] 223. ✅ Application deployed to EB
- [ ] 224. ✅ Health check passing (Green status)
- [ ] 225. ✅ RDS connection working
- [ ] 226. ✅ S3 uploads working (presigned URLs generated)
- [ ] 227. ✅ WebSocket connection established
- [ ] 228. ✅ Web client connects to EB backend
- [ ] 229. ✅ Mobile client connects to EB backend
- [ ] 230. ✅ End-to-end upload flow tested
- [ ] 231. ✅ Real-time progress updates working
- [ ] 232. ✅ Gallery displaying photos
- [ ] 233. ✅ Photo downloads working
- [ ] 234. ✅ No errors in application logs
- [ ] 235. ✅ Environment URL documented for submission
- [ ] 236. 🎉 Deployment complete!

### Post-Deployment Notes

**Environment URL Format:**
```
http://rapidphoto-prod-env.[region].elasticbeanstalk.com
```

**Common Commands:**
```bash
# Deploy updates
eb deploy

# Check status
eb status

# View logs
eb logs

# Stream logs
eb logs --stream

# Check health
eb health

# Open in browser
eb open

# SSH to instance (if enabled)
eb ssh

# Restart application
eb restart

# Set environment variable
eb setenv KEY=VALUE

# View all environment variables
eb printenv
```

**Remember:**
- Always test locally before deploying
- Verify port 5000 in application.yml
- Security groups are critical for RDS access
- WebSocket requires nginx configuration
- Environment variables must all be set
- IAM role needs S3 permissions

---

**End of tasks-8.md**