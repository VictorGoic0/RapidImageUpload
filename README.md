# RapidPhotoUpload

A production-grade, high-performance photo upload system demonstrating architectural excellence through Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), and Vertical Slice Architecture (VSA).

## Overview

RapidPhotoUpload handles up to 100 concurrent photo uploads while maintaining a fully responsive, non-blocking user experience across web and mobile platforms. The system uses AWS S3 presigned URLs for direct client-to-S3 uploads, eliminating backend bandwidth bottlenecks.

## Key Features

- **High Performance**: Handle 100 concurrent photo uploads (2MB each) within 90 seconds
- **Non-Blocking UI**: Zero UI blocking during upload operations
- **Real-Time Progress**: Live progress updates via WebSocket with 2-second throttling
- **Clean Architecture**: DDD + CQRS + Vertical Slice Architecture
- **Multi-Platform**: Web (React) and Mobile (React Native/Expo)

## Technology Stack

### Backend
- Java 21 with Virtual Threads
- Spring Boot 3.3+
- PostgreSQL 16
- AWS S3 for photo storage
- WebSocket (STOMP) for real-time updates

### Frontend
- **Web**: React 18.3.1 + TypeScript + Vite
- **Mobile**: React Native via Expo SDK 51+

## Prerequisites

- Java 21 JDK
- Docker Desktop (includes Docker Compose)
- Node.js 20.x LTS
- AWS CLI v2
- Maven 3.9+ (or use Maven Wrapper)

## Quick Start

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 2. Configure AWS

Ensure AWS credentials are configured:
```bash
aws configure
```

S3 buckets should already be created:
- `rapidphoto-dev` (development)
- `rapidphoto-prod` (production)

### 3. Backend Setup

```bash
cd backend
./mvnw spring-boot:run
```

### 4. Web Frontend

```bash
cd web-client
npm install
npm run dev
```

### 5. Mobile Frontend

```bash
cd mobile-client
npm install
npx expo start
```

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
- **WebSocket Throttling**: 2-second throttling reduces 10,000 events to ~500

## AWS Region

All AWS resources are configured for **us-east-2 (Ohio)**.

## License

This project is part of The Gauntlet assignment.

