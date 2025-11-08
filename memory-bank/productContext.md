# Product Context: RapidPhotoUpload

## Problem Statement
Users need to upload large batches of photos (up to 100) with real-time progress tracking across multiple devices, without experiencing UI blocking or performance degradation.

## Solution Overview
A full-stack photo upload system that:
1. **Initiates uploads** via batch API endpoint, receiving presigned S3 URLs
2. **Uploads directly to S3** from client devices (web/mobile), bypassing backend bandwidth
3. **Tracks progress** locally for instant UI feedback, with throttled WebSocket updates for cross-device sync
4. **Completes uploads** by notifying backend when S3 upload finishes
5. **Displays gallery** of uploaded photos with download capability

## User Experience Goals

### Upload Flow
1. User selects 1-100 photos (drag & drop on web, gallery picker on mobile)
2. System immediately shows upload queue with individual progress bars
3. Photos upload concurrently to S3 with real-time progress (0-100%)
4. Progress updates every 2 seconds via WebSocket (throttled from local XHR events)
5. User can navigate app freely during uploads (non-blocking UI)
6. Completion notifications appear across all connected devices

### Gallery Experience
- View all uploaded photos with metadata (filename, size, upload date)
- Download original photos from S3
- Responsive grid layout (web) and native list (mobile)

### Multi-Device Sync
- Progress visible simultaneously on web and mobile
- WebSocket broadcasts ensure all sessions stay in sync
- No manual refresh needed

## Technical User Requirements
- **Web**: Desktop browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS and Android via React Native (Expo)
- **Performance**: 100 photos (200MB total) upload in 60-90 seconds
- **Reliability**: Handle network interruptions gracefully
- **Feedback**: Always show current progress, never leave user guessing

## Business Value
- Demonstrates architectural excellence (DDD, CQRS, VSA)
- Showcases high-performance concurrent processing
- Proves scalability with direct S3 uploads (zero backend bandwidth)
- Real-world production patterns applicable to enterprise systems

