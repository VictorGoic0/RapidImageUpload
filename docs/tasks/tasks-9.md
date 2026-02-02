# PR #24: Replace STOMP WebSocket with Raw WebSocket Implementation

## Context
After extensive testing on Elastic Beanstalk, we discovered:
- ✅ Raw WebSocket connections work perfectly through EBS/ALB
- ❌ STOMP over WebSocket has handshake issues on EBS
- 💡 Raw WebSocket is simpler and sufficient for our upload progress use case

## Tasks

### Backend Implementation

1. [x] Create `UploadProgressWebSocketEndpoint.java` using JSR-356 (`@ServerEndpoint`)
   - ✅ Endpoint path: `/ws/upload-progress/{batchId}`
   - ✅ Handle session management per batch ID
   - ✅ Send progress updates as JSON messages
   - ✅ Handle client disconnections gracefully

2. [x] Create `BatchUploadProgress.java` DTO with batch context
   - ✅ Includes batchId, photoId, status, progress, totals

3. [x] Add batchId to `BatchUploadResponse`
   - ✅ Updated response to include generated batchId
   - ✅ Updated `BatchUploadCommandHandler` to generate and return batchId

4. [x] Add batchId to photo completion flow
   - ✅ Updated `CompletePhotoUploadCommand` with optional batchId
   - ✅ Updated `CompletePhotoRequest` with optional batchId
   - ✅ Updated `PhotoCompletionController` to pass through batchId

5. [x] Update `PhotoCompletionCommandHandler` to send WebSocket updates
   - ✅ Use `UploadProgressWebSocketEndpoint.sendProgressUpdate()` when batchId present
   - ✅ Send completion updates with batch context
   - ✅ Handle cases where no clients are connected
   - ✅ Fixed test compilation errors (added null batchId)
   - ✅ Deployed to EBS successfully

6. [ ] Remove STOMP configuration and dependencies (DEFERRED - after testing)
   - Delete `WebSocketConfig.java` (STOMP configuration)
   - Remove `@EnableWebSocketMessageBroker` annotation  
   - Remove STOMP TaskScheduler configuration from `AsyncConfig.java`
   - Keep `WebSocketServerConfig.java` (JSR-356 configuration)

7. [ ] Remove test endpoint (DEFERRED - after testing)
   - Delete `TestWebSocketEndpoint.java` after verification

8. [ ] Remove old progress service (DEFERRED - keeping for backwards compat)
   - Evaluate `WebSocketProgressService.java` usage
   - Remove if replaced by raw WebSocket

### Frontend Implementation (Mobile & Web)

5. [x] Update `mobile-client/services/websocket.ts`
   - ✅ Remove STOMP client usage
   - ✅ Implement raw WebSocket connection to `/ws/upload-progress/{batchId}`
   - ✅ Handle JSON message parsing
   - ✅ Keep connection lifecycle management

6. [x] Update `mobile-client/hooks/useWebSocket.ts`
   - ✅ Remove STOMP-specific code
   - ✅ Update to use raw WebSocket API
   - ✅ Maintain same interface for components

7. [x] Update `web-client/services/websocket.ts`
   - ✅ Replace SockJS/STOMP with raw WebSocket
   - ✅ Keep existing functionality
   - ✅ Update connection URL to `/ws/upload-progress/{batchId}`

8. [x] Update `web-client/hooks/useWebSocket.ts`
   - ✅ Remove STOMP dependencies
   - ✅ Implement raw WebSocket connection

### Testing & Verification

9. [x] Test mobile app WebSocket connection on iOS simulator
   - ✅ Working perfectly
10. [ ] Test mobile app WebSocket connection on Android (if applicable)
11. [x] Test web app WebSocket connection in browser
   - ✅ Working perfectly
12. [x] Verify upload progress updates work correctly
   - ✅ Real-time updates for all photos through single connection
13. [x] Test reconnection logic
   - ✅ Auto-reconnects up to 5 attempts
14. [x] Test multiple concurrent uploads
   - ✅ Single WebSocket connection handles all photos in batch
15. [x] Verify disconnection handling
   - ✅ Graceful cleanup on completion

### Deployment

16. [x] Deploy to Elastic Beanstalk
   - ✅ Backend deployed successfully
17. [x] Verify WebSocket connections work in production
   - ✅ Both mobile and web connecting successfully
18. [x] Monitor logs for any WebSocket errors
   - ✅ Clean logs, no errors
19. [x] Confirm health status is green
   - ✅ EBS health green

### Cleanup

20. [x] Remove unused STOMP dependencies from `pom.xml` (if any were added)
   - ✅ No STOMP dependencies found - already clean
21. [x] Remove SockJS dependencies from web-client `package.json`
   - ✅ Removed `@stomp/stompjs`, `sockjs-client`, `@types/sockjs-client`
22. [x] Remove `@stomp/stompjs` from mobile-client `package.json` (if not needed elsewhere)
   - ✅ Removed `@stomp/stompjs`, `sockjs-client`, `@types/sockjs-client`, `text-encoding`
23. [x] Update documentation to reflect raw WebSocket usage
   - ✅ Updated README.md with raw WebSocket references
   - ✅ Removed STOMP/SockJS mentions
24. [x] Remove `websocket-ebs-setup.md` (STOMP-specific troubleshooting doc)
   - ✅ File deleted

## Benefits

✅ **Simpler Architecture**: No STOMP protocol layer to maintain
✅ **Works on EBS**: Already proven with test endpoint
✅ **Better Performance**: One less protocol layer to traverse
✅ **Mobile-Friendly**: Native WebSocket support without extra libraries
✅ **Easier Debugging**: Plain JSON messages over WebSocket

## Message Format

```json
{
  "batchId": "uuid",
  "totalPhotos": 10,
  "completedPhotos": 5,
  "currentPhotoId": "uuid",
  "progress": 50,
  "status": "uploading|completed|failed"
}
```

## WebSocket Connection Pattern

### Mobile (React Native)
```javascript
const ws = new WebSocket(`wss://domain.com/ws/upload-progress/${batchId}`);
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  // Update UI
};
```

### Web (Browser)
```javascript
const ws = new WebSocket(`wss://domain.com/ws/upload-progress/${batchId}`);
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  // Update UI
};
```

## Notes

- Keep debug logging during initial rollout
- Monitor WebSocket connection count in production
- Consider adding heartbeat/ping mechanism if needed
- Raw WebSocket already tested and working on EBS ✅

