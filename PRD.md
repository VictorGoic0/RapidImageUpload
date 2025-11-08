# Product Requirements Document (PRD): RapidPhotoUpload

## AI-Assisted High-Volume Photo Upload System with Real-Time Progress Tracking

---

## 1. Executive Summary

### 1.1 Project Overview
RapidPhotoUpload is a production-grade, high-performance photo upload system demonstrating architectural excellence through Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), and Vertical Slice Architecture (VSA). The system handles up to 100 concurrent photo uploads while maintaining a fully responsive, non-blocking user experience across web and mobile platforms.

### 1.2 Key Success Metrics
- **Performance**: 100 concurrent uploads (2MB each) complete within 90 seconds
- **Responsiveness**: Zero UI blocking during upload operations
- **Real-Time Feedback**: Live progress updates via WebSocket with throttling
- **Architecture**: Clean separation across Domain, Application, and Infrastructure layers
- **Timeline**: Complete implementation in 5 days

### 1.3 Strategic Approach
This project leverages AWS S3 presigned URLs for direct client-to-S3 uploads, eliminating backend bandwidth bottlenecks while demonstrating sophisticated full-stack coordination through WebSocket-based progress tracking and clean architectural patterns.

---

## 2. Business Requirements

### 2.1 Core Functional Requirements

#### Upload Capabilities
- **Concurrent Processing**: Support 100 simultaneous photo uploads system-wide
- **File Specifications**: Handle images averaging 2MB each (JPEG, PNG, WebP)
- **Batch Operations**: Users can upload 1-100 photos in a single session
- **Direct S3 Upload**: Zero backend bandwidth consumption via presigned URLs

#### User Experience Requirements
- **Non-Blocking UI**: Full application navigation during active uploads
- **Real-Time Progress**: Individual file progress (0-100%) with 2-second update intervals
- **Batch Progress**: Aggregate progress across all uploads in current session
- **Status Indicators**: Visual feedback for PENDING, UPLOADING, COMPLETED, FAILED states
- **Multi-Device Sync**: Progress visible across web and mobile simultaneously

#### Data Management
- **Photo Gallery**: View all uploaded photos with metadata
- **Download Capability**: Retrieve original photos from S3
- **Tagging System**: Add/edit tags for photo organization (optional enhancement)
- **Metadata Tracking**: Store filename, upload timestamp, file size, S3 key

### 2.2 Authentication (Scope)
- **MVP**: Mocked authentication with hardcoded user IDs
- **Post-MVP**: JWT-based authentication with Spring Security (if time permits)

### 2.3 Platform Requirements
- **Web Application**: Desktop browser support (Chrome, Firefox, Safari, Edge)
- **Mobile Application**: iOS and Android via React Native (Expo)
- **Shared Backend**: Single REST API serving both platforms

---

## 3. Technical Architecture

### 3.1 Architectural Principles (Mandatory)

#### Domain-Driven Design (DDD)
**Core Domain Models:**
```java
// Entities (with identity)
- Photo: Represents uploaded image with lifecycle
- User: System user (mocked for MVP)

// Value Objects (immutable)
- PhotoId: UUID-based identifier
- UserId: UUID-based identifier
- S3Key: Storage location reference
- UploadStatus: Enum (PENDING, UPLOADING, COMPLETED, FAILED)

// Domain Services
- PhotoUploadService: Orchestrates upload workflow
- PresignedUrlGenerator: Creates time-limited S3 URLs

// Repositories
- PhotoRepository: Data access abstraction
```

**Domain Logic Placement:**
```java
@Entity
public class Photo {
    // Business logic lives IN the domain object
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

#### Command Query Responsibility Segregation (CQRS)
**Command Side (Writes):**
```
/commands
  - InitiateBatchUploadCommand.java
  - CompletePhotoUploadCommand.java
  - BatchUploadCommandHandler.java
  - PhotoCompletionCommandHandler.java
```

**Query Side (Reads):**
```
/queries
  - GetPhotosQuery.java
  - GetPhotoByIdQuery.java
  - PhotoQueryHandler.java
```

**Separation Benefits:**
- Commands: Async, can be queued, focus on business rules
- Queries: Synchronous, optimized for read performance
- Independent scaling and optimization

#### Vertical Slice Architecture (VSA)
**Feature-Based Organization:**
```
/features
  /batch-upload
    - BatchUploadController.java
    - BatchUploadCommandHandler.java
    - InitiateBatchUploadCommand.java
    - BatchUploadResponse.java
  
  /photo-query
    - PhotoQueryController.java
    - PhotoQueryHandler.java
    - GetPhotosQuery.java
    - PhotoQueryResponse.java
  
  /photo-completion
    - PhotoCompletionController.java
    - CompletePhotoUploadCommand.java
    - PhotoCompletionCommandHandler.java

/domain (shared across features)
  - Photo.java
  - PhotoId.java
  - UserId.java
  - PhotoRepository.java
  - UploadStatus.java

/infrastructure (shared services)
  - S3Service.java
  - WebSocketProgressService.java
  - DatabaseConfig.java
```

### 3.2 System Architecture Flow

#### Upload Process (Presigned URL Strategy)
```
1. Client Request Phase
   Client → POST /api/photos/batch-init
   Body: {
     userId: "uuid",
     photos: [
       {fileName: "photo1.jpg", contentType: "image/jpeg", size: 2048576},
       {fileName: "photo2.jpg", contentType: "image/jpeg", size: 1987654}
     ]
   }

2. Backend Processing
   - BatchUploadCommandHandler executes
   - Creates 100 Photo entities (status: PENDING)
   - Saves to PostgreSQL
   - Generates 100 S3 presigned URLs (15-minute expiration)
   - Returns response

3. Response to Client
   {
     uploads: [
       {photoId: "uuid1", presignedUrl: "https://s3.../photo1.jpg?..."},
       {photoId: "uuid2", presignedUrl: "https://s3.../photo2.jpg?..."}
     ]
   }

4. Direct S3 Upload
   - Client uploads each file to its presigned URL via XHR PUT
   - Client tracks progress locally (instant UI feedback)
   - Client sends throttled progress via WebSocket (every 2 seconds)
   - Backend broadcasts progress to all connected user sessions

5. Upload Completion
   - Client detects XHR completion (100%)
   - Client → POST /api/photos/{photoId}/complete
   - Backend updates Photo.status to COMPLETED
   - Backend sends WebSocket completion notification

6. Gallery Retrieval
   - Client → GET /api/photos?userId={userId}
   - PhotoQueryHandler returns photo metadata
   - Client generates S3 download URLs for display
```

#### WebSocket Progress Architecture
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
  |    (throttled, every 2s)       |                                |
  |                                |--- UPDATE progress ----------→|
  |                                |                                |
  |←-- WS: {photoId, 23%} ---------|                                |
  |    (broadcast to all sessions) |                                |
  |                                |                                |
  |--- WS: {photoId, 45%} -------→|                                |
  |←-- WS: {photoId, 45%} ---------|                                |
  |                                |                                |
  |--- POST /complete -----------→|                                |
  |                                |--- UPDATE status=COMPLETED --→|
  |←-- 200 OK --------------------|                                |
  |                                |                                |
  |←-- WS: {photoId, COMPLETED} --|                                |
```

#### WebSocket Throttling Implementation
```typescript
// Frontend: Throttled progress updates
let lastWSUpdate = 0;
const THROTTLE_MS = 2000;

xhr.upload.addEventListener('progress', (e) => {
  const percent = Math.round((e.loaded / e.total) * 100);
  const now = Date.now();
  
  // ALWAYS update local UI (instant feedback)
  setLocalProgress(photoId, percent);
  
  // THROTTLED WebSocket updates (reduces load)
  if (now - lastWSUpdate > THROTTLE_MS || percent === 100) {
    sendProgress(photoId, percent); // WebSocket message
    lastWSUpdate = now;
  }
});
```

**Throttling Benefits:**
- Reduces WebSocket messages from 10,000 to ~500 (for 100 uploads)
- Backend processes manageable load
- Still provides real-time feel (2-second updates)
- Always sends 100% completion message

---

## 4. Technical Stack

### 4.1 Backend

#### Core Framework
- **Language**: Java 21
- **Framework**: Spring Boot 3.3+
- **Concurrency**: Virtual Threads (Project Loom)
  ```java
  @Configuration
  @EnableAsync
  public class AsyncConfig {
      @Bean
      public Executor taskExecutor() {
          return Executors.newVirtualThreadPerTaskExecutor();
      }
  }
  ```

#### Dependencies
```xml
<!-- Spring Boot Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- WebSocket Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- PostgreSQL -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>

<!-- AWS S3 -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.20.0</version>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

#### Database
- **Development**: PostgreSQL 16 (Docker container)
- **Production**: AWS RDS PostgreSQL 16
- **Connection Pool**: HikariCP (Spring Boot default)
- **Migration**: Flyway or Liquibase

#### Cloud Storage
- **Service**: AWS S3
- **Buckets**: 
  - `rapidphoto-dev` (development/testing)
  - `rapidphoto-prod` (production)
- **Strategy**: Presigned URLs (PUT for upload, GET for download)
- **Expiration**: 15 minutes for upload URLs

### 4.2 Web Frontend

#### Core Stack
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "7.9.5",
    "axios": "1.13.2",
    "@stomp/stompjs": "^7.0.0",
    "sockjs-client": "^1.6.1"
  }
}
```

#### Build Tools
- **Build Tool**: Vite 7.1.7
- **TypeScript**: 5.x
- **Package Manager**: npm or pnpm

#### UI Components & Styling
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "1.1.15",
    "@radix-ui/react-slot": "1.2.4",
    "@radix-ui/react-switch": "1.2.6",
    "tailwindcss": "3.4.17",
    "tailwindcss-animate": "1.0.7",
    "tailwind-merge": "3.3.1",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.552.0",
    "recharts": "3.3.0"
  }
}
```

#### Development Tools
```json
{
  "devDependencies": {
    "eslint": "9.36.0",
    "postcss": "8.4.47",
    "autoprefixer": "10.4.20",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

### 4.3 Mobile Frontend

#### Framework
- **Platform**: React Native via Expo SDK 51+
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)

#### Key Dependencies
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react-native": "0.74.5",
    "expo-router": "~3.5.0",
    "expo-image-picker": "~15.0.0",
    "expo-file-system": "~17.0.0",
    "axios": "1.13.2",
    "@stomp/stompjs": "^7.0.0"
  }
}
```

#### Mobile-Specific Features
- **Image Picker**: `expo-image-picker` for camera/gallery access
- **File Upload**: `expo-file-system` for multipart uploads
- **WebSocket**: Same STOMP library as web (compatible)

### 4.4 Development Environment

#### Required Software
```bash
# Java Development Kit
Java 21 (Temurin, Corretto, or Oracle)

# Build Tool
Maven 3.9+ (or use ./mvnw wrapper)

# Docker Desktop
Docker Desktop 4.x (includes Docker Compose)

# Node.js
Node.js 20.x LTS

# AWS CLI
AWS CLI 2.x (for S3 bucket setup)
```

#### IDE Recommendations
- **Backend**: IntelliJ IDEA Community/Ultimate or VS Code with Java extensions
- **Frontend**: VS Code with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

---

## 5. Development Setup Guide

### 5.1 Prerequisites Installation

#### Step 1: Install Java 21
```bash
# macOS (Homebrew)
brew install openjdk@21

# Windows (Chocolatey)
choco install openjdk21

# Linux (Ubuntu/Debian)
sudo apt install openjdk-21-jdk

# Verify installation
java -version  # Should show version 21.x
```

#### Step 2: Install Docker Desktop
```bash
# Download from: https://www.docker.com/products/docker-desktop/

# macOS
# Download .dmg and install

# Windows
# Download installer, requires WSL2

# Linux
# Follow distribution-specific instructions

# Verify installation
docker --version
docker compose version
```

#### Step 3: Install Node.js
```bash
# macOS (Homebrew)
brew install node@20

# Windows (Chocolatey)
choco install nodejs-lts

# Or download from: https://nodejs.org/

# Verify installation
node --version  # Should show v20.x
npm --version
```

#### Step 4: Install AWS CLI
```bash
# macOS
brew install awscli

# Windows
# Download MSI installer from AWS

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### Step 5: Configure AWS Credentials
```bash
# Run AWS configure
aws configure

# Enter when prompted:
AWS Access Key ID: [your-access-key]
AWS Secret Access Key: [your-secret-key]
Default region name: us-east-2
Default output format: json

# Verify credentials file created
cat ~/.aws/credentials
```

### 5.2 Project Setup

#### Step 1: Create S3 Buckets
```bash
# Development bucket
aws s3 mb s3://rapidphoto-dev --region us-east-2

# Production bucket
aws s3 mb s3://rapidphoto-prod --region us-east-2

# Configure CORS for development bucket
aws s3api put-bucket-cors --bucket rapidphoto-dev --cors-configuration file://cors-config.json

# cors-config.json content:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "http://localhost:8080"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}

# Verify buckets created
aws s3 ls
```

#### Step 2: Setup PostgreSQL (Docker)
```bash
# Create project directory
mkdir rapidphoto
cd rapidphoto

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: rapidphoto-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: rapidphoto
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker compose up -d

# Verify PostgreSQL is running
docker compose ps
docker compose logs postgres

# Test connection
docker exec -it rapidphoto-postgres psql -U postgres -d rapidphoto -c "SELECT version();"
```

#### Step 3: Initialize Spring Boot Backend
```bash
# Option 1: Use Spring Initializr
curl https://start.spring.io/starter.tgz \
  -d dependencies=web,websocket,data-jpa,postgresql,validation \
  -d javaVersion=21 \
  -d bootVersion=3.3.0 \
  -d type=maven-project \
  -d groupId=com.rapidphoto \
  -d artifactId=backend \
  -d name=RapidPhotoUpload \
  | tar -xzvf -

cd backend

# Add AWS S3 dependency to pom.xml
# (See section 4.1 for complete pom.xml)

# Create application.yml
mkdir -p src/main/resources
cat > src/main/resources/application.yml << 'EOF'
spring:
  application:
    name: rapidphoto
  
  profiles:
    active: dev
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

---
# Development Profile
spring:
  config:
    activate:
      on-profile: dev
  
  datasource:
    url: jdbc:postgresql://localhost:5432/rapidphoto
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver

aws:
  s3:
    bucket: rapidphoto-dev
    region: us-east-2

server:
  port: 8080

---
# Production Profile
spring:
  config:
    activate:
      on-profile: prod
  
  datasource:
    url: jdbc:postgresql://${RDS_HOSTNAME}:${RDS_PORT:5432}/${RDS_DB_NAME}
    username: ${RDS_USERNAME}
    password: ${RDS_PASSWORD}

aws:
  s3:
    bucket: rapidphoto-prod
    region: us-east-2

server:
  port: 8080
EOF

# Run application
./mvnw spring-boot:run

# Verify backend is running
curl http://localhost:8080/actuator/health
```

#### Step 4: Initialize React Web Frontend
```bash
# Navigate back to project root
cd ..

# Create Vite React app
npm create vite@latest web-client -- --template react-ts

cd web-client

# Install dependencies
npm install

# Install additional packages
npm install axios @stomp/stompjs sockjs-client
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-switch
npm install tailwindcss-animate tailwind-merge class-variance-authority clsx
npm install lucide-react recharts react-router-dom

# Initialize Tailwind
npx tailwindcss init -p

# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-animate")],
}
EOF

# Update src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Start development server
npm run dev

# Access at http://localhost:5173
```

#### Step 5: Initialize React Native Mobile App
```bash
# Navigate back to project root
cd ..

# Create Expo app
npx create-expo-app@latest mobile-client --template blank-typescript

cd mobile-client

# Install dependencies
npx expo install expo-router expo-image-picker expo-file-system
npm install axios @stomp/stompjs

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

### 5.3 Project Structure

```
rapidphoto/
├── backend/                          # Spring Boot application
│   ├── src/
│   │   └── main/
│   │       ├── java/com/rapidphoto/
│   │       │   ├── RapidPhotoApplication.java
│   │       │   ├── config/
│   │       │   │   ├── AsyncConfig.java
│   │       │   │   ├── WebSocketConfig.java
│   │       │   │   └── S3Config.java
│   │       │   ├── domain/           # Shared domain models
│   │       │   │   ├── Photo.java
│   │       │   │   ├── PhotoId.java
│   │       │   │   ├── UserId.java
│   │       │   │   ├── UploadStatus.java
│   │       │   │   └── PhotoRepository.java
│   │       │   ├── features/         # Vertical slices
│   │       │   │   ├── batchupload/
│   │       │   │   │   ├── BatchUploadController.java
│   │       │   │   │   ├── BatchUploadCommandHandler.java
│   │       │   │   │   ├── InitiateBatchUploadCommand.java
│   │       │   │   │   └── BatchUploadResponse.java
│   │       │   │   ├── photoquery/
│   │       │   │   │   ├── PhotoQueryController.java
│   │       │   │   │   ├── PhotoQueryHandler.java
│   │       │   │   │   ├── GetPhotosQuery.java
│   │       │   │   │   └── PhotoQueryResponse.java
│   │       │   │   └── photocompletion/
│   │       │   │       ├── PhotoCompletionController.java
│   │       │   │       ├── CompletePhotoUploadCommand.java
│   │       │   │       └── PhotoCompletionCommandHandler.java
│   │       │   └── infrastructure/   # Shared services
│   │       │       ├── S3Service.java
│   │       │       ├── WebSocketProgressService.java
│   │       │       └── UploadProgressController.java
│   │       └── resources/
│   │           ├── application.yml
│   │           └── db/migration/     # Flyway migrations
│   └── pom.xml
├── web-client/                       # React web app
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   └── ui/                   # Shadcn components
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── usePhotoUpload.ts
│   │   │   └── usePhotoGallery.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── types/
│   │   │   └── photo.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── mobile-client/                    # React Native (Expo) app
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── upload.tsx
│   │   │   └── gallery.tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/
│   │   ├── PhotoPicker.tsx
│   │   ├── UploadProgress.tsx
│   │   └── PhotoGrid.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── usePhotoUpload.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── upload.ts
│   ├── package.json
│   └── app.json
└── docker-compose.yml                # PostgreSQL for development
```

---

## 6. Implementation Timeline (5 Days)

### Day 1: Backend Foundation & S3 Integration (8 hours)

#### Morning (4 hours)
- ✅ Environment setup (Java, Docker, AWS CLI)
- ✅ Create Spring Boot project with dependencies
- ✅ Configure PostgreSQL connection (Docker)
- ✅ Create S3 buckets and configure CORS
- ✅ Implement S3Service with presigned URL generation

**Deliverables:**
```java
@Service
public class S3Service {
    public String generatePresignedUploadUrl(String key, String contentType);
    public String generatePresignedDownloadUrl(String key);
}
```

#### Afternoon (4 hours)
- ✅ Design domain models (Photo, PhotoId, UserId, UploadStatus)
- ✅ Create PhotoRepository with Spring Data JPA
- ✅ Implement batch upload feature (VSA structure)
  - BatchUploadController
  - BatchUploadCommandHandler
  - InitiateBatchUploadCommand

**Deliverables:**
- POST /api/photos/batch-init endpoint working
- Returns presigned URLs for 100 photos
- Photos saved to PostgreSQL with PENDING status

**Test:** Use Postman to initiate batch upload and verify response

---

### Day 2: WebSocket Implementation & Photo Completion (8 hours)

#### Morning (4 hours)
- ✅ Configure Spring WebSocket with STOMP
- ✅ Implement WebSocketProgressService
- ✅ Create UploadProgressController for receiving client updates
- ✅ Test WebSocket connection with simple client

**Deliverables:**
```java
@Service
public class WebSocketProgressService {
    public void sendProgressToUser(UserId userId, PhotoProgress progress);
}

@Controller
public class UploadProgressController {
    @MessageMapping("/upload-progress")
    public void receiveProgress(@Payload PhotoProgress progress);
}
```

#### Afternoon (4 hours)
- ✅ Implement photo completion feature (VSA structure)
  - PhotoCompletionController
  - CompletePhotoUploadCommand
  - PhotoCompletionCommandHandler
- ✅ Implement photo query feature (CQRS)
  - PhotoQueryController
  - PhotoQueryHandler
  - GetPhotosQuery

**Deliverables:**
- POST /api/photos/{id}/complete endpoint working
- GET /api/photos?userId={id} endpoint working
- WebSocket notifications sent on completion

**Test:** Use Postman + WebSocket client to verify flow

---

### Day 3: React Web Application (8 hours)

#### Morning (4 hours)
- ✅ Setup React + Vite + TypeScript project
- ✅ Install and configure Tailwind CSS + Shadcn
- ✅ Create API service layer (axios)
- ✅ Implement WebSocket hook with throttling

**Deliverables:**
```typescript
// hooks/useWebSocket.ts
export function useWebSocketProgress(userId: string) {
  const [progress, setProgress] = useState<Map<string, PhotoProgress>>(new Map());
  const sendProgress = (photoId: string, percent: number) => {...};
  return { progress, sendProgress };
}

// hooks/usePhotoUpload.ts
export function usePhotoUpload() {
  const uploadPhotos = async (files: File[]) => {...};
  return { uploadPhotos, uploading, error };
}
```

#### Afternoon (4 hours)
- ✅ Build upload UI components
  - UploadZone (drag & drop)
  - ProgressIndicator (individual & batch)
  - File list with status
- ✅ Implement upload flow with XHR progress tracking
- ✅ Integrate WebSocket for real-time updates

**Deliverables:**
- Functional upload page with drag & drop
- Real-time progress bars (throttled WebSocket updates)
- Batch upload of 100 photos working

**Test:** Upload 10 photos, verify progress updates every 2 seconds

---

### Day 4: React Native Mobile App & AWS Deployment (10 hours)

#### Morning (4 hours)
- ✅ Create Expo project with TypeScript
- ✅ Setup Expo Router with tab navigation
- ✅ Implement photo picker (expo-image-picker)
- ✅ Port WebSocket hook from web (same code)
- ✅ Build upload screen with progress indicators

**Deliverables:**
- Upload tab with camera/gallery picker
- Progress tracking UI
- WebSocket integration working on mobile

#### Afternoon - Deployment (6 hours)

**Backend Deployment to Elastic Beanstalk:**
```bash
# 1. Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier rapidphoto-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password [SECURE_PASSWORD] \
  --allocated-storage 20

# 2. Package Spring Boot application
./mvnw clean package -DskipTests

# 3. Initialize Elastic Beanstalk
eb init -p "Corretto 21" rapidphoto --region us-east-2

# 4. Create environment with RDS connection
eb create rapidphoto-prod-env \
  --database.engine postgres \
  --database.username postgres

# 5. Set environment variables
eb setenv \
  SPRING_PROFILES_ACTIVE=prod \
  AWS_REGION=us-east-2 \
  S3_BUCKET=rapidphoto-prod

# 6. Deploy
eb deploy

# 7. Get application URL
eb open
```

**Web Frontend Deployment to S3 + CloudFront:**
```bash
# 1. Build React app
npm run build

# 2. Create S3 bucket for hosting
aws s3 mb s3://rapidphoto-web-prod

# 3. Configure bucket for static hosting
aws s3 website s3://rapidphoto-web-prod \
  --index-document index.html \
  --error-document index.html

# 4. Upload build files
aws s3 sync dist/ s3://rapidphoto-web-prod --delete

# 5. Create CloudFront distribution (optional, for HTTPS)
aws cloudfront create-distribution \
  --origin-domain-name rapidphoto-web-prod.s3.amazonaws.com

# 6. Access application
# http://rapidphoto-web-prod.s3-website-us-east-2.amazonaws.com
```

**Mobile App:**
- ✅ Update API base URL to Elastic Beanstalk endpoint
- ✅ Test on physical device via Expo Go
- ✅ (Optional) Create Expo build for app stores

**Deliverables:**
- Backend running on Elastic Beanstalk
- Web app hosted on S3
- Mobile app connecting to production backend
- All three components communicating successfully

---

### Day 5: Testing, Documentation & Demo (8 hours)

#### Morning (4 hours)

**Integration Tests:**
```java
@SpringBootTest
@AutoConfigureMockMvc
class PhotoUploadIntegrationTest {
    
    @Test
    void shouldHandleBatchUploadFlow() {
        // 1. Initiate batch upload
        BatchUploadRequest request = new BatchUploadRequest(userId, photoMetadata);
        BatchUploadResponse response = initiateUpload(request);
        
        // 2. Verify presigned URLs generated
        assertThat(response.uploads()).hasSize(100);
        
        // 3. Mock S3 upload completion
        response.uploads().forEach(upload -> {
            mockS3Upload(upload.presignedUrl());
            completeUpload(upload.photoId());
        });
        
        // 4. Verify photos marked as COMPLETED
        List<Photo> photos = photoRepository.findByUserId(userId);
        assertThat(photos).allMatch(p -> p.getStatus() == UploadStatus.COMPLETED);
    }
    
    @Test
    void shouldBroadcastProgressViaWebSocket() {
        // Connect WebSocket client
        // Send progress update
        // Verify broadcast received
    }
    
    @Test
    void shouldHandleFailedUploads() {
        // Simulate S3 upload failure
        // Verify status updated to FAILED
    }
}
```

**Test Scenarios:**
- ✅ Single user uploads 100 photos
- ✅ 100 users upload 1 photo each (concurrency test)
- ✅ WebSocket progress updates received
- ✅ Failed upload handling
- ✅ Photo gallery retrieval

#### Afternoon (4 hours)

**Technical Documentation (1-2 pages):**
```markdown
# RapidPhotoUpload Technical Overview

## Architecture Decisions

### Presigned URL Strategy
- Rationale: Eliminates backend bandwidth bottleneck
- Trade-offs: Client-side validation, presigned URL expiration
- Result: Zero server bandwidth, infinite scalability

### WebSocket with Throttling
- Challenge: 10,000 progress events for 100 uploads
- Solution: 2-second throttling reduces to ~500 events
- Result: Real-time feel with manageable backend load

### DDD + CQRS + VSA
- Domain: Photo entity with business logic methods
- CQRS: Separate command (upload) and query (gallery) handlers
- VSA: Features organized in self-contained slices
- Result: Clean, maintainable, testable architecture

### Concurrency Approach
- Virtual Threads: Lightweight, millions of concurrent operations
- Async processing: @Async on upload methods
- Result: 100 concurrent uploads handled efficiently

## Technology Choices

- Java 21: Virtual threads for concurrency
- Spring Boot: Rapid development, production-ready
- PostgreSQL: Reliable, ACID-compliant metadata storage
- S3: Scalable, durable object storage
- WebSocket (STOMP): Real-time bidirectional communication
- React + TypeScript: Type-safe, component-based UI
- React Native (Expo): Cross-platform mobile with minimal effort

## Performance Results

- 100 concurrent uploads: 60-90 seconds (S3 + network dependent)
- UI responsiveness: Zero blocking, 60fps maintained
- WebSocket latency: <100ms progress updates
- Database load: Minimal (batch inserts, throttled updates)
```

**Demo Video (5-7 minutes):**
1. **Introduction** (30s): Project overview
2. **Web Demo** (2min):
   - Drag & drop 20 photos
   - Show real-time progress bars
   - Navigate app while uploading (non-blocking)
   - View gallery with uploaded photos
3. **Mobile Demo** (2min):
   - Pick photos from gallery
   - Upload with progress tracking
   - Show progress syncing across web & mobile
4. **Backend Architecture** (1min):
   - Code walkthrough of DDD/CQRS/VSA structure
   - Show WebSocket throttling implementation
5. **Concurrency Test** (1min):
   - Upload 100 photos simultaneously
   - Show completion within 90 seconds
6. **Conclusion** (30s): Key achievements

**AI Tool Documentation:**
```markdown
# AI Tools Used

## Cursor / GitHub Copilot
- **Component scaffolding**: Generated boilerplate for React components
- **TypeScript interfaces**: Auto-completed type definitions
- **Test cases**: Suggested test scenarios and assertions
- **Impact**: 30% faster frontend development

## Example Prompts:
1. "Create a React component for drag & drop file upload with Tailwind styling"
2. "Generate Spring Boot controller with CQRS pattern for photo upload"
3. "Write integration test for WebSocket progress updates"

## v0.dev (Optional)
- **UI prototyping**: Rapid mockup of upload interface
- **Impact**: Visual design clarity before implementation
```

**Deliverables:**
- ✅ Passing integration tests
- ✅ Technical writeup (PDF)
- ✅ Demo video (uploaded to YouTube/Loom)
- ✅ AI tool documentation
- ✅ README with setup instructions

---

## 7. API Specification

### 7.1 REST Endpoints

#### Initiate Batch Upload
```http
POST /api/photos/batch-init
Content-Type: application/json
Authorization: Bearer {token} (for post-MVP)

Request:
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "photos": [
    {
      "fileName": "vacation1.jpg",
      "contentType": "image/jpeg",
      "size": 2048576
    },
    {
      "fileName": "vacation2.jpg",
      "contentType": "image/png",
      "size": 1987654
    }
  ]
}

Response: 201 Created
{
  "uploads": [
    {
      "photoId": "photo-uuid-1",
      "fileName": "vacation1.jpg",
      "presignedUrl": "https://rapidphoto-dev.s3.amazonaws.com/users/123e4567.../vacation1.jpg?X-Amz-Algorithm=...",
      "expiresAt": "2025-11-08T12:30:00Z"
    },
    {
      "photoId": "photo-uuid-2",
      "fileName": "vacation2.jpg",
      "presignedUrl": "https://rapidphoto-dev.s3.amazonaws.com/users/123e4567.../vacation2.jpg?X-Amz-Algorithm=...",
      "expiresAt": "2025-11-08T12:30:00Z"
    }
  ]
}
```

#### Complete Photo Upload
```http
POST /api/photos/{photoId}/complete
Content-Type: application/json

Request:
{
  "s3Key": "users/123e4567.../vacation1.jpg"
}

Response: 200 OK
{
  "photoId": "photo-uuid-1",
  "status": "COMPLETED",
  "uploadedAt": "2025-11-08T12:15:30Z"
}
```

#### Get User Photos
```http
GET /api/photos?userId={userId}&page=0&size=20
Authorization: Bearer {token} (for post-MVP)

Response: 200 OK
{
  "photos": [
    {
      "photoId": "photo-uuid-1",
      "fileName": "vacation1.jpg",
      "status": "COMPLETED",
      "uploadedAt": "2025-11-08T12:15:30Z",
      "size": 2048576,
      "downloadUrl": "https://rapidphoto-dev.s3.amazonaws.com/users/123e4567.../vacation1.jpg?X-Amz-Algorithm=..."
    }
  ],
  "page": 0,
  "totalPages": 5,
  "totalElements": 100
}
```

#### Get Photo by ID
```http
GET /api/photos/{photoId}

Response: 200 OK
{
  "photoId": "photo-uuid-1",
  "fileName": "vacation1.jpg",
  "status": "COMPLETED",
  "uploadedAt": "2025-11-08T12:15:30Z",
  "size": 2048576,
  "downloadUrl": "https://rapidphoto-dev.s3.amazonaws.com/users/123e4567.../vacation1.jpg?X-Amz-Algorithm=..."
}
```

### 7.2 WebSocket Protocol

#### Connection
```javascript
// Client connects to WebSocket
const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  connectHeaders: {
    Authorization: 'Bearer {token}' // For post-MVP
  }
});

client.activate();
```

#### Subscribe to Progress Updates
```javascript
// Subscribe to user-specific progress channel
client.subscribe('/user/queue/progress', (message) => {
  const progress = JSON.parse(message.body);
  /*
  {
    "photoId": "photo-uuid-1",
    "fileName": "vacation1.jpg",
    "status": "UPLOADING",
    "progressPercentage": 45,
    "message": "Uploading..."
  }
  */
});
```

#### Send Progress Update (Client → Server)
```javascript
// Client sends progress update
client.publish({
  destination: '/app/upload-progress',
  body: JSON.stringify({
    photoId: 'photo-uuid-1',
    progressPercentage: 67,
    status: 'UPLOADING'
  })
});
```

#### Receive Completion Notification (Server → Client)
```javascript
// Server broadcasts completion
client.subscribe('/user/queue/progress', (message) => {
  const completion = JSON.parse(message.body);
  /*
  {
    "photoId": "photo-uuid-1",
    "fileName": "vacation1.jpg",
    "status": "COMPLETED",
    "progressPercentage": 100,
    "message": "Upload complete"
  }
  */
});
```

---

## 8. Testing Strategy

### 8.1 Backend Integration Tests

**Test Scope:**
- Batch upload initialization with presigned URL generation
- Photo completion flow with database updates
- WebSocket progress broadcasting
- Query endpoints with pagination
- Error handling (invalid requests, S3 failures)

**Mock Strategy:**
```java
@SpringBootTest
@AutoConfigureMockMvc
class PhotoUploadIntegrationTest {
    
    @MockBean
    private S3Service s3Service; // Mock S3 for tests
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private PhotoRepository photoRepository;
    
    @Test
    void shouldInitiateBatchUpload() throws Exception {
        // Mock S3 presigned URL generation
        when(s3Service.generatePresignedUploadUrl(anyString(), anyString()))
            .thenReturn("https://s3.mock.url/photo.jpg");
        
        // Send batch init request
        mockMvc.perform(post("/api/photos/batch-init")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.uploads").isArray())
            .andExpect(jsonPath("$.uploads.length()").value(2));
        
        // Verify photos saved to database
        List<Photo> photos = photoRepository.findByUserId(userId);
        assertThat(photos).hasSize(2);
        assertThat(photos).allMatch(p -> p.getStatus() == UploadStatus.PENDING);
    }
}
```

### 8.2 Frontend Testing

**Manual Testing Checklist:**
- ✅ Drag & drop file upload (web)
- ✅ Select photos from gallery (mobile)
- ✅ Progress bars update in real-time
- ✅ UI remains responsive during uploads
- ✅ Batch progress calculation correct
- ✅ Gallery displays uploaded photos
- ✅ Download photos from gallery
- ✅ WebSocket reconnection on disconnect
- ✅ Error handling (network failure, S3 timeout)

**Optional Unit Tests (if time permits):**
```typescript
// Test throttling logic
describe('useThrottledProgress', () => {
  it('should throttle progress updates to 2 seconds', () => {
    const sendProgress = jest.fn();
    const { throttledSend } = useThrottledProgress(sendProgress);
    
    throttledSend('photo-1', 10);
    throttledSend('photo-1', 20); // Should be throttled
    
    expect(sendProgress).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(2000);
    throttledSend('photo-1', 30);
    
    expect(sendProgress).toHaveBeenCalledTimes(2);
  });
});
```

### 8.3 Performance Testing

**Concurrency Load Test:**
```bash
# Use Apache Bench or k6 for load testing
k6 run - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '90s',
};

export default function () {
  let response = http.post('http://localhost:8080/api/photos/batch-init', 
    JSON.stringify({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      photos: [{ fileName: 'test.jpg', contentType: 'image/jpeg', size: 2048576 }]
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF
```

**Expected Results:**
- 100 concurrent requests handled successfully
- Average response time < 500ms
- Zero failed requests
- Database connection pool not exhausted

---

## 9. Deployment Architecture

### 9.1 AWS Infrastructure (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud (us-east-2)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   CloudFront (CDN)                      │ │
│  │         HTTPS: https://photos.yourdomain.com           │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │              S3: rapidphoto-web-prod                    │ │
│  │          (Static React web application)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          Elastic Beanstalk Environment                   ││
│  │                                                           ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │      Application Load Balancer (ALB)             │   ││
│  │  │  HTTP: http://rapidphoto-env.elasticbeanstalk... │   ││
│  │  └────────┬─────────────────────┬───────────────────┘   ││
│  │           │                     │                        ││
│  │  ┌────────▼────────┐   ┌───────▼────────┐              ││
│  │  │  EC2 Instance 1  │   │  EC2 Instance 2 │              ││
│  │  │  Spring Boot App │   │  Spring Boot App │              ││
│  │  │  (Java 21)       │   │  (Java 21)       │              ││
│  │  └────────┬─────────┘   └───────┬─────────┘              ││
│  │           │                     │                        ││
│  │           └──────────┬──────────┘                        ││
│  │                      │                                   ││
│  │           ┌──────────▼──────────┐                        ││
│  │           │   RDS PostgreSQL    │                        ││
│  │           │ (db.t3.micro)       │                        ││
│  │           │  rapidphoto-prod    │                        ││
│  │           └─────────────────────┘                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              S3: rapidphoto-prod                         ││
│  │           (Photo storage bucket)                         ││
│  │     - Users upload directly via presigned URLs           ││
│  │     - Private bucket with bucket policies                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          CloudWatch Logs & Metrics                       ││
│  │    - Application logs from Elastic Beanstalk             ││
│  │    - RDS performance metrics                             ││
│  │    - S3 request metrics                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Client Devices                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │   Web Browser    │          │  Mobile Device   │         │
│  │  (React App)     │          │ (React Native)   │         │
│  └──────────────────┘          └──────────────────┘         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 9.2 Cost Estimation (Monthly)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Elastic Beanstalk | 2 × t3.micro EC2 (free tier eligible) | $0-15 |
| RDS PostgreSQL | db.t3.micro (free tier eligible) | $0-15 |
| S3 Storage | 10GB storage + requests | $0.50 |
| CloudFront | 10GB data transfer | $0.85 |
| Data Transfer | 10GB out | $0.90 |
| **Total (after free tier)** | | **~$17-32/month** |

**Free Tier Benefits (First 12 months):**
- 750 hours/month EC2 t3.micro
- 750 hours/month RDS db.t3.micro
- 5GB S3 storage
- 50GB CloudFront data transfer

### 9.3 Deployment Commands

**Initial Setup:**
```bash
# 1. Install Elastic Beanstalk CLI
pip install awsebcli

# 2. Initialize EB application
cd backend
eb init -p "Corretto 21" rapidphoto --region us-east-2

# 3. Create RDS instance (one-time)
aws rds create-db-instance \
  --db-instance-identifier rapidphoto-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password [SECURE_PASSWORD] \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --publicly-accessible

# 4. Create EB environment with environment variables
eb create rapidphoto-prod-env \
  --instance-type t3.micro \
  --envvars \
    SPRING_PROFILES_ACTIVE=prod,\
    AWS_REGION=us-east-2,\
    S3_BUCKET=rapidphoto-prod,\
    RDS_HOSTNAME=[RDS_ENDPOINT],\
    RDS_PORT=5432,\
    RDS_DB_NAME=rapidphoto,\
    RDS_USERNAME=postgres,\
    RDS_PASSWORD=[SECURE_PASSWORD]
```

**Continuous Deployment:**
```bash
# Backend
cd backend
./mvnw clean package -DskipTests
eb deploy

# Web Frontend
cd web-client
npm run build
aws s3 sync dist/ s3://rapidphoto-web-prod --delete
aws cloudfront create-invalidation --distribution-id [ID] --paths "/*"
```

---

## 10. Success Criteria & Evaluation

### 10.1 Functional Requirements
- ✅ System handles 100 concurrent uploads within 90 seconds
- ✅ Web and mobile apps remain responsive during uploads
- ✅ Real-time progress updates visible on all connected devices
- ✅ Photos successfully stored in S3 and metadata in PostgreSQL
- ✅ Gallery displays all uploaded photos with download capability

### 10.2 Architectural Requirements
- ✅ DDD: Domain models with business logic encapsulation
- ✅ CQRS: Clear separation of commands and queries
- ✅ VSA: Features organized in self-contained slices
- ✅ Clean code: Consistent naming, modularity, documentation

### 10.3 Technical Requirements
- ✅ Java 21 with Virtual Threads for concurrency
- ✅ Spring Boot with WebSocket support
- ✅ PostgreSQL for metadata persistence
- ✅ AWS S3 with presigned URL strategy
- ✅ React 18 + TypeScript for web
- ✅ React Native (Expo) for mobile
- ✅ WebSocket with 2-second throttling

### 10.4 Testing Requirements
- ✅ Integration tests covering upload flow
- ✅ WebSocket notification tests
- ✅ Manual testing of 100 concurrent uploads
- ✅ UI responsiveness validation

### 10.5 Deliverables
- ✅ GitHub repository with all three applications
- ✅ Technical writeup (1-2 pages)
- ✅ Demo video (5-7 minutes)
- ✅ AI tool documentation
- ✅ Deployed applications on AWS
- ✅ README with setup instructions

---

## 11. Risk Mitigation

### 11.1 Technical Risks

| Risk | Mitigation Strategy |
|------|-------------------|
| **WebSocket complexity** | Use Spring Boot starter with proven STOMP library. Test early (Day 2). |
| **S3 presigned URL expiration** | Set 15-minute expiration. Handle client-side renewal if needed. |
| **100 concurrent uploads overwhelming backend** | Virtual threads handle thousands of concurrent operations efficiently. |
| **Mobile build issues (Expo)** | Use Expo Go for development. Defer native builds to post-MVP. |
| **AWS deployment complexity** | Use Elastic Beanstalk (simplest option). Test locally with Docker first. |

### 11.2 Timeline Risks

| Risk | Mitigation Strategy |
|------|-------------------|
| **Feature creep (authentication, tagging)** | Defer to post-MVP. Focus on core upload/progress functionality. |
| **Deployment takes longer than expected** | Allocate full Day 4 afternoon. Use Elastic Beanstalk for simplicity. |
| **Integration test complexity** | Mock S3 service. Focus on critical paths only. |
| **Demo video production time** | Record as you build. Final edit on Day 5 only. |

### 11.3 Scope Management

**MVP Scope (Must Have):**
- ✅ Upload 100 photos with progress tracking
- ✅ WebSocket real-time updates
- ✅ Photo gallery with download
- ✅ DDD + CQRS + VSA architecture
- ✅ Deployed to AWS

**Post-MVP (Nice to Have):**
- ❌ JWT authentication (use mocked userId)
- ❌ Photo tagging system
- ❌ Advanced error recovery (retry logic)
- ❌ Image compression/optimization
- ❌ Native mobile app builds (use Expo Go)

---

## 12. Appendix

### 12.1 Glossary

- **DDD**: Domain-Driven Design - Software design approach focusing on core business logic
- **CQRS**: Command Query Responsibility Segregation - Pattern separating read and write operations
- **VSA**: Vertical Slice Architecture - Code organization by feature instead of technical layer
- **Presigned URL**: Time-limited URL for direct S3 access without AWS credentials
- **WebSocket**: Protocol enabling bidirectional real-time communication
- **Throttling**: Rate-limiting technique to reduce event frequency
- **Virtual Threads**: Lightweight Java 21 threads for high concurrency

### 12.2 Reference Links

**Documentation:**
- Spring Boot: https://spring.io/projects/spring-boot
- AWS S3 SDK: https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html
- WebSocket (STOMP): https://stomp.github.io/
- React: https://react.dev/
- Expo: https://docs.expo.dev/

**Learning Resources:**
- DDD: https://martinfowler.com/bliki/DomainDrivenDesign.html
- CQRS: https://martinfowler.com/bliki/CQRS.html
- Java Virtual Threads: https://openjdk.org/jeps/444

### 12.3 Contact & Support

**Project Repository:** `https://github.com/[your-username]/rapidphoto`  
**Demo Video:** `https://youtu.be/[video-id]`  
**Technical Questions:** [your-email]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | [Your Name] | Initial PRD creation |

---

**End of Document**