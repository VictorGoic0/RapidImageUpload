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

### Cloud Services
- **Storage**: AWS S3
  - Dev bucket: `rapidphoto-dev`
  - Prod bucket: `rapidphoto-prod`
  - Presigned URLs: 15-minute expiration for uploads, 60-minute for downloads
- **Deployment**: AWS Elastic Beanstalk (backend), S3 + CloudFront (web frontend)
- **Database**: AWS RDS PostgreSQL 16 (production)

### Web Frontend
- **Framework**: React 18.3.1 with TypeScript 5.x
- **Build Tool**: Vite 7.1.7
- **Package Manager**: npm or pnpm
- **HTTP Client**: Axios 1.13.2
- **WebSocket**: @stomp/stompjs 7.0.0, sockjs-client 1.6.1
- **UI Components**: Radix UI, Tailwind CSS 3.4.17
- **Charts**: Recharts 3.3.0 (for progress visualization)

### Mobile Frontend
- **Framework**: React Native via Expo SDK 51+
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Image Picker**: expo-image-picker ~15.0.0
- **File System**: expo-file-system ~17.0.0
- **WebSocket**: Same STOMP library as web

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
      ddl-auto: update
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
    region: us-east-1

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
- **Region**: us-east-1 (default)
- **Credentials**: Via `~/.aws/credentials` or environment variables
- **S3 CORS**: Configured for localhost:5173 (web) and localhost:8080 (backend)

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
- **Backend**: AWS Elastic Beanstalk (Java 21 Corretto)
  - Application Load Balancer
  - Auto-scaling: 2 × t3.micro EC2 instances
- **Database**: AWS RDS PostgreSQL 16 (db.t3.micro)
- **Storage**: AWS S3 (rapidphoto-prod bucket)
- **Web Frontend**: S3 static hosting + CloudFront CDN
- **Monitoring**: CloudWatch Logs & Metrics

### Environment Variables (Production)
```
SPRING_PROFILES_ACTIVE=prod
AWS_REGION=us-east-1
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
- **Node.js**: 20.x LTS (required for React 18 and Expo SDK 51)
- **Java**: 21 (required for Virtual Threads)
- **PostgreSQL**: 16 (latest stable)
- **Spring Boot**: 3.3+ (compatible with Java 21)
- **Expo SDK**: 51+ (compatible with React Native 0.74.5)

