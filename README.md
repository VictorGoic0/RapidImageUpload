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

- Java 21 JDK
- Docker Desktop (includes Docker Compose)
- Node.js 20.x LTS
- AWS CLI v2
- Maven 3.9+ (or use Maven Wrapper)

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
- Ensure S3 buckets exist: `rapidphoto-dev` (development)

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

S3 buckets should already be created:
- `rapidphoto-dev` (development)
- `rapidphoto-prod` (production)

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

## Architecture

- **DDD**: Domain models with encapsulated business logic
- **CQRS**: Separate command (write) and query (read) handlers
- **VSA**: Features organized in self-contained vertical slices
- **Presigned URLs**: Direct client-to-S3 uploads (zero backend bandwidth)
- **Raw WebSocket**: Efficient real-time progress updates per batch upload

## AWS Region

All AWS resources are configured for **us-east-2 (Ohio)**.

## License

This project is part of The Gauntlet assignment.

