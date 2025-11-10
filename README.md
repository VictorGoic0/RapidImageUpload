# RapidPhotoUpload

A production-grade, high-performance photo upload system demonstrating architectural excellence through Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), and Vertical Slice Architecture (VSA).

## Overview

RapidPhotoUpload handles up to 100 concurrent photo uploads while maintaining a fully responsive, non-blocking user experience across web and mobile platforms. The system uses AWS S3 presigned URLs for direct client-to-S3 uploads, eliminating backend bandwidth bottlenecks.

## Key Features

- **High Performance**: Handle 100 concurrent photo uploads (2MB each) within 90 seconds
- **Non-Blocking UI**: Zero UI blocking during upload operations
- **Real-Time Progress**: Live progress updates via raw WebSocket connections
- **Clean Architecture**: DDD + CQRS + Vertical Slice Architecture
- **Multi-Platform**: Web (React) and Mobile (React Native/Expo)

## Technology Stack

### Backend
- Java 21 with Virtual Threads
- Spring Boot 3.3+
- PostgreSQL 16
- AWS S3 for photo storage
- Raw WebSocket (JSR-356) for real-time updates

### Frontend
- **Web**: React 19.1.1 + TypeScript + Vite
  - **UI Components**: Shadcn/ui (built on Radix UI + Tailwind CSS)
  - **Styling**: Tailwind CSS 3.4+ with custom design system
  - **Icons**: Lucide React
  - **Routing**: React Router DOM
  - **HTTP Client**: Axios
  - **WebSocket**: Native WebSocket API
- **Mobile**: React Native via Expo SDK 51+

## Prerequisites

- **Java 21 JDK** (Temurin/Corretto/Oracle JDK)
  - Verify: `java -version` should show 21.x
- **Docker Desktop** (includes Docker Compose)
  - Verify: `docker --version` and `docker compose version`
- **Node.js 20.x LTS**
  - Verify: `node --version` should show v20.x
- **AWS CLI v2**
  - Verify: `aws --version`
  - Configure: `aws configure` (Access Key ID, Secret Key, region: us-east-2)
- **Maven 3.9+** (or use Maven Wrapper included in project)

## Running Locally

### Running the Backend

Start the Spring Boot backend in development mode:

```bash
cd backend
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080` by default.

**First time setup:**
- Ensure PostgreSQL is running: `docker compose up -d`
- Configure AWS credentials: `aws configure`
- Create S3 buckets (see [S3 Bucket Setup](#s3-bucket-setup) below)
- Configure environment variables (see [Environment Variables](#environment-variables) below)

### Running the Frontend

Start the React web client in development mode:

```bash
cd web-client
npm install  # First time only
npm run dev
```

The web client will start on `http://localhost:5173` (Vite default).

**First time setup:**
- Ensure Node.js 20.x LTS is installed
- Run `npm install` to install dependencies

## Starting the Application

### 1. Start PostgreSQL Database

Start the PostgreSQL container:

```bash
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
```

### 2. Configure AWS Credentials

Ensure AWS credentials are configured:
```bash
aws configure
```

### S3 Bucket Setup

Create S3 buckets for development and production:

```bash
# Create development bucket
aws s3 mb s3://rapidphoto-dev --region us-east-2

# Create production bucket
aws s3 mb s3://rapidphoto-prod --region us-east-2

# Apply CORS configuration
aws s3api put-bucket-cors --bucket rapidphoto-dev --cors-configuration file://s3-cors-config.json
aws s3api put-bucket-cors --bucket rapidphoto-prod --cors-configuration file://s3-cors-config.json
```

Verify buckets:
```bash
aws s3 ls
```

### Environment Variables

#### Backend Environment Variables

Create `backend/src/main/resources/application-dev.yml` or set environment variables:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rapidphoto
    username: postgres
    password: postgres

aws:
  s3:
    bucket: rapidphoto-dev
    region: us-east-2
```

For production, set these environment variables in your deployment platform:
- `SPRING_DATASOURCE_URL`: RDS PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `AWS_S3_BUCKET`: S3 bucket name (rapidphoto-prod)
- `AWS_S3_REGION`: AWS region (us-east-2)

#### Web Client Environment Variables

Create `web-client/.env.local` for development:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

For production, set in Netlify environment variables:
- `VITE_API_BASE_URL`: Backend ECS ALB URL (https://)
- `VITE_WS_URL`: Backend WebSocket URL (wss://)

#### Mobile Client Environment Variables

Create `mobile-client/.env.local` for development:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
```

For production, update these in `mobile-client/services/api.ts` and `mobile-client/services/websocket.ts`:
- `EXPO_PUBLIC_API_BASE_URL`: Backend ECS ALB URL (https://)
- `EXPO_PUBLIC_WS_URL`: Backend WebSocket URL (wss://)

### 3. Start Backend

See [Running the Backend](#running-the-backend) section above.

### 4. Start Web Client

See [Running the Frontend](#running-the-frontend) section above.

### 5. Start Mobile Client

**Development mode**:
```bash
cd mobile-client
npm install  # First time only
npx expo start
```

This will:
- Start the Expo development server
- Open Expo Go app on your device or emulator
- Provide QR code for scanning

## Quick Start

For a quick development setup, follow these steps in order:

1. **Start PostgreSQL**: `docker compose up -d`
2. **Configure AWS**: `aws configure` (ensure S3 buckets exist)
3. **Start Backend**: `cd backend && ./mvnw spring-boot:run`
4. **Start Web Client**: `cd web-client && npm install && npm run dev`
5. **Start Mobile Client**: `cd mobile-client && npm install && npx expo start`

See the [Running Locally](#running-locally) and [Starting the Application](#starting-the-application) sections above for detailed commands and options.

## Project Structure

```
rapidphoto/
├── backend/              # Spring Boot application
├── web-client/           # React web app
├── mobile-client/       # React Native (Expo) app
└── docker-compose.yml    # PostgreSQL for development
```

## PostgreSQL Docker Setup

The project includes a `docker-compose.yml` file for local PostgreSQL development:

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: rapidphoto
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

Start the database:
```bash
docker compose up -d
```

Stop the database:
```bash
docker compose down
```

## Architecture

- **DDD**: Domain models with encapsulated business logic
- **CQRS**: Separate command (write) and query (read) handlers
- **VSA**: Features organized in self-contained vertical slices
- **Presigned URLs**: Direct client-to-S3 uploads (zero backend bandwidth)
- **Raw WebSocket**: Efficient real-time progress updates per batch upload

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Deployment

### Backend Deployment (AWS Elastic Beanstalk)

1. **Build the application:**
   ```bash
   cd backend
   mvn clean package
   ```

2. **Create Elastic Beanstalk application:**
   - Use AWS Console or EB CLI
   - Platform: Java 21
   - Upload the JAR file: `target/rapidphoto-backend-1.0.0.jar`

3. **Configure environment variables:**
   - Set RDS connection string
   - Set S3 bucket and region
   - Configure SSL certificate in ALB

4. **Deploy:**
   ```bash
   eb deploy
   ```

### Web Client Deployment (Netlify)

1. **Connect repository:**
   - Import from GitHub
   - Base directory: `web-client`
   - Build command: `npm run build`
   - Publish directory: `web-client/dist`

2. **Set environment variables:**
   - `VITE_API_BASE_URL`: Backend ALB URL
   - `VITE_WS_URL`: Backend WebSocket URL

3. **Deploy:**
   - Automatic deployment on push to main branch
   - Or manual deploy from Netlify dashboard

### Mobile Client

The mobile client uses Expo Go for development and testing. For production deployment:

1. **Configure production API URLs** in `mobile-client/services/api.ts` and `websocket.ts`
2. **Build with Expo:**
   ```bash
   cd mobile-client
   npx expo build:android  # or build:ios
   ```

## Testing

### Backend Tests

Run all tests:
```bash
cd backend
mvn test
```

Run integration tests:
```bash
mvn verify
```

### Frontend Tests

Run web client tests:
```bash
cd web-client
npm test
```

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed system architecture and design patterns
- **[AI_TOOLS.md](AI_TOOLS.md)**: AI tools used and their impact
- **[PRD.md](PRD.md)**: Product Requirements Document

## AWS Region

All AWS resources are configured for **us-east-2 (Ohio)**.

## License

This project is part of The Gauntlet assignment.

