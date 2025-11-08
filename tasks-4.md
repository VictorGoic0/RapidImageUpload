# RapidPhotoUpload Tasks - Part 4: React Web Application

## PR #10: React Project Setup & Configuration

### Project Initialization
- [x] 1. Navigate to root directory: `cd rapidphoto`
- [x] 2. Create React app: `npm create vite@latest web-client -- --template react-ts`
- [x] 3. Navigate to web-client: `cd web-client`
- [x] 4. Install dependencies: `npm install`
- [x] 5. Install Axios: `npm install axios`
- [x] 6. Install WebSocket libraries: `npm install @stomp/stompjs sockjs-client`
- [x] 7. Install React Router: `npm install react-router-dom`
- [x] 8. Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
- [x] 9. Initialize Tailwind: `npx tailwindcss init -p`
- [x] 10. Install Radix UI components: `npm install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-switch`
- [x] 11. Install Tailwind utilities: `npm install tailwindcss-animate tailwind-merge class-variance-authority clsx`
- [x] 12. Install Lucide icons: `npm install lucide-react`
- [x] 13. Install Recharts: `npm install recharts` (Removed - not needed)
- [x] 14. Install TypeScript types: `npm install -D @types/sockjs-client`

### Tailwind Configuration
- [x] 15. Update `tailwind.config.js` content paths to include all source files
- [x] 16. Add tailwindcss-animate plugin to Tailwind config
- [x] 17. Update `src/index.css` with Tailwind directives (@tailwind base, components, utilities)
- [x] 18. Add custom CSS variables for theme colors (Shadcn/ui Slate theme)
- [x] 19. Test Tailwind: add bg-blue-500 class to test component (Shadcn/ui initialized)

### Project Structure
- [x] 20. Create `src/components/` directory
- [x] 21. Create `src/components/ui/` directory for Shadcn components
- [x] 22. Create `src/hooks/` directory
- [x] 23. Create `src/services/` directory
- [x] 24. Create `src/types/` directory
- [x] 25. Create `src/pages/` directory
- [x] 26. Create `src/lib/` directory for utilities (with utils.ts)

### Shadcn/ui Setup
- [x] Initialize Shadcn/ui with Slate base color
- [x] Configure path aliases (@/*)
- [x] Set up components.json
- [x] Configure Tailwind theme with CSS variables

---

## PR #11: Type Definitions & API Service Layer

### TypeScript Type Definitions
- [x] 1. Create `src/types/photo.ts`
- [x] 2. Define UploadStatus enum: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED'
- [x] 3. Define PhotoMetadata interface with fileName, contentType, size
- [x] 4. Define PresignedUploadInfo interface matching backend response
- [x] 5. Define BatchUploadResponse interface
- [x] 6. Define Photo interface matching PhotoDto from backend
- [x] 7. Define PhotoProgress interface for WebSocket messages
- [x] 8. Define PhotoQueryResponse interface with pagination
- [x] 9. Add JSDoc comments to all interfaces
- [x] 10. Export all types from photo.ts

### API Service Layer
- [x] 11. Create `src/services/api.ts`
- [x] 12. Import axios
- [x] 13. Create axios instance with baseURL from environment variable
- [x] 14. Configure default timeout (30 seconds)
- [x] 15. Add request interceptor for logging (optional)
- [x] 16. Add response interceptor for error handling
- [x] 17. Create function `initiateBatchUpload(userId: string, photos: PhotoMetadata[])`
- [x] 18. Implement POST /api/photos/batch-init
- [x] 19. Return Promise<BatchUploadResponse>
- [x] 20. Add error handling and type safety
- [x] 21. Create function `completePhotoUpload(photoId: string, userId: string, s3Key: string)`
- [x] 22. Implement POST /api/photos/{photoId}/complete
- [x] 23. Return Promise<{status: string}>
- [x] 24. Create function `getUserPhotos(userId: string, page: number, size: number)`
- [x] 25. Implement GET /api/photos with query params
- [x] 26. Return Promise<PhotoQueryResponse>
- [x] 27. Create function `getPhotoById(photoId: string, userId: string)`
- [x] 28. Implement GET /api/photos/{photoId}
- [x] 29. Return Promise<Photo>
- [x] 30. Export all API functions

### Upload Service
- [x] 31. Create `src/services/upload.ts`
- [x] 32. Create function `uploadToS3(file: File, presignedUrl: string, onProgress: (percent: number) => void)`
- [x] 33. Use XMLHttpRequest for upload to track progress
- [x] 34. Listen to xhr.upload 'progress' event
- [x] 35. Calculate percentage: (loaded / total) * 100
- [x] 36. Call onProgress callback with percentage
- [x] 37. Return Promise that resolves on completion
- [x] 38. Handle upload errors and rejections
- [x] 39. Add content-type header matching file type
- [x] 40. Use PUT method for presigned URL upload
- [x] 41. Export uploadToS3 function

---

## PR #12: WebSocket Hook & Connection Management

### WebSocket Service
- [x] 1. Create `src/services/websocket.ts`
- [x] 2. Import Client from @stomp/stompjs
- [x] 3. Import SockJS from sockjs-client
- [x] 4. Create function `createWebSocketClient(url: string)`
- [x] 5. Configure Client with webSocketFactory using SockJS
- [x] 6. Set broker URL from environment variable
- [x] 7. Configure debug logging (console.log in dev)
- [x] 8. Configure reconnect delay (5 seconds)
- [x] 9. Return configured Client instance
- [x] 10. Export createWebSocketClient

### WebSocket Hook
- [x] 11. Create `src/hooks/useWebSocket.ts`
- [x] 12. Import React hooks: useState, useEffect, useRef, useCallback
- [x] 13. Import Client and PhotoProgress types
- [x] 14. Define hook function: `useWebSocket(userId: string)`
- [x] 15. Create state: `const [connected, setConnected] = useState(false)`
- [x] 16. Create state: `const [progress, setProgress] = useState<Map<string, PhotoProgress>>(new Map())`
- [x] 17. Create ref: `const clientRef = useRef<Client | null>(null)`
- [x] 18. Create useEffect to initialize WebSocket connection
- [x] 19. Create Client using createWebSocketClient()
- [x] 20. Configure onConnect callback to set connected state true
- [x] 21. Subscribe to `/user/queue/progress` in onConnect
- [x] 22. Parse received message body as PhotoProgress
- [x] 23. Update progress Map with new PhotoProgress (use photoId as key)
- [x] 24. Configure onStompError callback for error logging
- [x] 25. Configure onDisconnect callback to set connected false
- [x] 26. Call client.activate() to start connection
- [x] 27. Store client in clientRef.current
- [x] 28. Return cleanup function to call client.deactivate()
- [x] 29. Add userId to dependency array
- [x] 30. Create sendProgress callback function
- [x] 31. Check if client is connected
- [x] 32. Publish message to `/app/upload-progress` destination
- [x] 33. Serialize PhotoProgress to JSON in message body
- [x] 34. Add error handling for send failures
- [x] 35. Wrap in useCallback with clientRef dependency
- [x] 36. Return object: `{ connected, progress, sendProgress }`
- [x] 37. Export useWebSocket hook

### Throttled Progress Hook
- [x] 38. Create `src/hooks/useThrottledProgress.ts`
- [x] 39. Import useRef, useCallback
- [x] 40. Define hook: `useThrottledProgress(sendProgress: Function, throttleMs = 2000)`
- [x] 41. Create ref: `lastUpdateRef` as Map<string, number>
- [x] 42. Create throttledSend callback function
- [x] 43. Accept photoId and progressPercent parameters
- [x] 44. Get current timestamp: `Date.now()`
- [x] 45. Get last update time from lastUpdateRef for this photoId
- [x] 46. Calculate time since last update
- [x] 47. Check if enough time passed OR progress is 100%
- [x] 48. If yes: call sendProgress and update lastUpdateRef
- [x] 49. If no: skip sending (throttled)
- [x] 50. Wrap in useCallback with sendProgress dependency
- [x] 51. Return throttledSend function
- [x] 52. Export useThrottledProgress hook