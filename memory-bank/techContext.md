# Technical Context: RapidPhotoUpload

## Technology Stack

### Backend
- **Language**: Java 21 (Temurin/Corretto/Oracle JDK)
- **Framework**: Spring Boot 3.3+
- **Concurrency**: Virtual Threads (Project Loom)
- **Build Tool**: Maven 3.9+ (or Maven Wrapper)
- **Database**: PostgreSQL 16 (Docker for dev, RDS for prod)
- **ORM**: Spring Data JPA with Hibernate
- **Migration**: Flyway or Liquibase
- **WebSocket**: Spring WebSocket with STOMP protocol
  - TaskScheduler bean in AsyncConfig (required for heartbeat functionality)
  - WebSocketConfig uses constructor injection to receive TaskScheduler
  - Heartbeat configured: 10-second send/receive intervals

### Cloud Services
- **Storage**: AWS S3
  - Dev bucket: `rapidphoto-dev`
  - Prod bucket: `rapidphoto-prod`
  - Presigned URLs: 15-minute expiration for uploads, 60-minute for downloads
- **Deployment**: 
  - Backend: AWS Elastic Beanstalk with Application Load Balancer (ALB)
  - Web Frontend: Netlify (with automatic SSL and continuous deployment)
  - Database: AWS RDS PostgreSQL 16 (production)
- **SSL/TLS**: 
  - Backend: SSL certificate on ALB (self-signed or ACM certificate)
  - Frontend: Netlify automatic SSL provisioning

### Web Frontend
- **Framework**: React 19.1.0 with TypeScript 5.x
- **Build Tool**: Vite 7.1.7
- **Package Manager**: npm
- **Package Type**: ES modules (`"type": "module"` in package.json)
- **Design Approach**: Desktop-first (no mobile responsiveness constraints)
  - Full-screen layouts with `w-full` classes
  - No max-width constraints on main containers
  - Background colors span edge-to-edge
  - Large fonts, generous spacing, wide layouts optimized for desktop
- **TypeScript Configuration**:
  - `verbatimModuleSyntax: true` enabled in tsconfig.app.json
  - **CRITICAL**: All type-only imports MUST use `import type` syntax
  - Example: `import type { IMessage } from '@stomp/stompjs'` (not `import { IMessage }`)
  - Mixing types and values: `import { Client } from '@stomp/stompjs'; import type { IMessage } from '@stomp/stompjs'`
- **HTTP Client**: Axios 1.13.2
  - API client timeout: 90 seconds (configured for large file uploads)
  - Request/response interceptors for logging and error handling
- **WebSocket**: Native WebSocket API (no libraries)
  - Raw WebSocket implementation (JSR-356 on backend)
- **UI Components**: Shadcn/ui (Radix UI), Tailwind CSS 3.4.18
- **Icons**: Lucide React 0.553.0
- **Styling**: Tailwind CSS with tailwindcss-animate plugin (ES module import syntax)
- **Navigation**: Underlined active state (not button-style)
- **Authentication**: React Context API with localStorage persistence
  - AuthContext provides global authentication state
  - ProtectedRoute component for route protection
  - LoginPage and RegisterPage components

### Mobile Frontend
- **Framework**: React Native 0.81.4 via Expo SDK 54
- **React Version**: React 19.1.0 (same as web frontend)
- **Language**: TypeScript 5.9.2
- **Navigation**: Expo Router (file-based routing)
- **Image Picker**: expo-image-picker ~17.0.8
- **File System**: expo-file-system ~19.0.17
- **WebSocket**: Native WebSocket API (no libraries)
- **HTTP Client**: Axios 1.13.2 (same as web)
- **Environment Variables**: Expo native support (EXPO_PUBLIC_* prefix)
- **Package Manager**: npm
- **Styling**: React Native StyleSheet (no Tailwind)
- **Icons**: Unicode emoji (📤, 🖼️) for tab navigation
- **Authentication**: React Context API with AsyncStorage persistence
  - AuthContext provides global authentication state
  - RootLayoutNav component handles protected navigation
  - Login and Register screens
  - AsyncStorage package: @react-native-async-storage/async-storage

## Development Environment

### Required Software
- Java 21 JDK
- Docker Desktop 4.x (includes Docker Compose)
- Node.js 20.x LTS
- AWS CLI 2.x
- Maven 3.9+ (or use Maven Wrapper)

### IDE Recommendations
- **Backend**: IntelliJ IDEA Community/Ultimate or VS Code with Java extensions
- **Frontend**: VS Code with ESLint, Prettier, Tailwind CSS IntelliSense

## Project Structure

```
rapidphoto/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/rapidphoto/
│   │   ├── RapidPhotoApplication.java
│   │   ├── config/             # Configuration classes
│   │   ├── domain/             # Domain models (shared)
│   │   ├── features/           # Vertical slices
│   │   │   ├── batchupload/
│   │   │   ├── photoquery/
│   │   │   └── photocompletion/
│   │   └── infrastructure/     # Shared services
│   └── pom.xml
├── web-client/                 # React web app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── mobile-client/              # React Native (Expo) app
│   ├── app/                    # Expo Router pages
│   ├── components/
│   ├── hooks/
│   └── services/
└── docker-compose.yml          # PostgreSQL for development
```

## Configuration

### Backend Configuration (application.yml)
```yaml
spring:
  application:
    name: rapidphoto
  profiles:
    active: dev
  jpa:
    hibernate:
      ddl-auto: update  # Automatically creates/updates schema (users table, photos.user_id foreign key)
    show-sql: true

# Development Profile
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/rapidphoto
    username: postgres
    password: postgres

aws:
  s3:
    bucket: rapidphoto-dev
    region: us-east-2

server:
  port: 8080
```

### Database Setup
- **Development**: PostgreSQL 16 in Docker container
  - Port: 5432
  - Database: rapidphoto
  - User: postgres / Password: postgres
- **Production**: AWS RDS PostgreSQL 16
  - Instance: db.t3.micro
  - Connection via environment variables

### AWS Configuration
- **Region**: us-east-2 (Ohio)
- **Credentials**: Via `~/.aws/credentials` or environment variables
- **S3 CORS**: Configured for 5 front-end domains (see CorsConfig.java for complete list)

### CORS Configuration
- **Backend CORS**: Centralized in `CorsConfig.java` with allowed origins including:
  - Development: localhost:5173-5177 (Vite dev servers)
  - Production: Netlify domain (added for production deployment)
- **WebSocket CORS**: Uses same origins from `CorsConfig.ALLOWED_ORIGINS` constant
- **REST API CORS**: Configured globally for all `/api/**` endpoints
- **Important**: Always use `CorsConfig.ALLOWED_ORIGINS` constant, never hardcode origins
- **Production**: Netlify domain must be included in allowed origins for API access

## Key Dependencies

### Backend (pom.xml)
```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
  </dependency>
  <dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.20.0</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
</dependencies>
```

### Web Frontend (package.json)
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "7.9.5",
    "axios": "1.13.2",
    "@stomp/stompjs": "^7.0.0",
    "sockjs-client": "^1.6.1",
    "tailwindcss": "3.4.17",
    "@radix-ui/react-dialog": "1.1.15",
    "lucide-react": "0.552.0",
    "recharts": "3.3.0"
  }
}
```

## Deployment Architecture

### Production Stack
- **Backend**: AWS Elastic Beanstalk (Java 21)
  - Application Load Balancer (ALB) with HTTPS listener
  - SSL certificate configured (self-signed or ACM)
  - WebSocket support over WSS (secure WebSocket)
- **Database**: AWS RDS PostgreSQL 16 (db.t3.micro)
- **Storage**: AWS S3 (rapidphoto-prod bucket)
- **Web Frontend**: Netlify
  - Automatic SSL provisioning
  - Continuous deployment from GitHub
  - SPA routing support
- **Monitoring**: CloudWatch Logs & Metrics

### Environment Variables (Production)
```
SPRING_PROFILES_ACTIVE=prod
AWS_REGION=us-east-2
S3_BUCKET=rapidphoto-prod
RDS_HOSTNAME=[RDS_ENDPOINT]
RDS_PORT=5432
RDS_DB_NAME=rapidphoto
RDS_USERNAME=postgres
RDS_PASSWORD=[SECURE_PASSWORD]
```

## Performance Targets
- **Concurrent Uploads**: 100 simultaneous uploads
- **Upload Time**: 60-90 seconds for 100 photos (2MB each)
- **Response Time**: <500ms for API endpoints
- **WebSocket Latency**: <100ms for progress updates
- **UI Responsiveness**: 60fps maintained during uploads

## Version Compatibility
- **Node.js**: 20.x LTS (required for React 19 and Expo SDK 54)
- **Java**: 21 (required for Virtual Threads)
- **PostgreSQL**: 16 (latest stable)
- **Spring Boot**: 3.3+ (compatible with Java 21)
- **React**: 19.1.0 (web and mobile)
- **React Native**: 0.81.4 (compatible with React 19)
- **Expo SDK**: 54 (compatible with React 19 and React Native 0.81.4)

