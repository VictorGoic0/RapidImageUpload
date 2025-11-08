# RapidPhotoUpload Tasks - Part 6: React Native Mobile App

## PR #16: React Native Project Setup

### Expo Project Initialization
- [ ] 1. Navigate to root directory: `cd rapidphoto`
- [ ] 2. Create Expo app: `npx create-expo-app@latest mobile-client --template blank-typescript`
- [ ] 3. Navigate to mobile-client: `cd mobile-client`
- [ ] 4. **IMPORTANT**: Verify React version is 18 (not 19) - check `package.json` and downgrade if needed: `npm install react@18 react-dom@18`
- [ ] 5. **IMPORTANT**: Install React Native version compatible with React 18: React Native 0.69.0 through 0.77.x are compatible with React 18. Use latest 0.77.x: `npx expo install react-native@0.77.x` (DO NOT use 0.78.0+ as it requires React 19)
- [ ] 6. Install Expo Router: `npx expo install expo-router react-native-safe-area-context react-native-screens`
- [ ] 7. Install image picker: `npx expo install expo-image-picker`
- [ ] 8. Install file system: `npx expo install expo-file-system`
- [ ] 9. Install Axios: `npm install axios`
- [ ] 10. Install WebSocket: `npm install @stomp/stompjs`
- [ ] 11. Install polyfills: `npm install text-encoding`
- [ ] 12. **IMPORTANT**: Install react-native-web for web testing: `npm install react-native-web`
- [ ] 13. Update `package.json` to include expo-router entry point

### Expo Configuration
- [ ] 14. Update `app.json` with app name: "RapidPhoto"
- [ ] 15. Add scheme: "rapidphoto" for deep linking
- [ ] 16. Configure iOS bundle identifier
- [ ] 17. Configure Android package name
- [ ] 18. Add permissions for camera and photo library
- [ ] 19. Set up splash screen and icon (use defaults for now)
- [ ] 20. Configure orientation (portrait preferred)
- [ ] 21. **IMPORTANT**: Configure web platform support in `app.json` for testing (add web configuration)

### Project Structure
- [ ] 22. Create `app/tabs/` directory for tab navigation
- [ ] 23. Create `app/tabs/_layout.tsx` for tab configuration
- [ ] 24. Create `app/tabs/upload.tsx` for upload screen
- [ ] 25. Create `app/tabs/gallery.tsx` for gallery screen
- [ ] 26. Create `components/` directory
- [ ] 27. Create `hooks/` directory
- [ ] 28. Create `services/` directory
- [ ] 29. Create `types/` directory
- [ ] 30. Create `constants/` directory
- [ ] 31. **IMPORTANT**: Set up Expo environment variables (NOT react-native-dotenv)
- [ ] 32. Create `.env` file with API_URL and WS_URL (Expo will handle this automatically)
- [ ] 33. Configure environment variables in `app.json` or use `process.env` (Expo handles env vars natively)
- [ ] 34. **DO NOT** install react-native-dotenv - Expo handles environment variables internally

---

## PR #17: Mobile Services & Type Definitions

### Type Definitions
- [ ] 1. Create `types/photo.ts` (copy from web app)
- [ ] 2. Define same interfaces: PhotoMetadata, Photo, PhotoProgress, etc.
- [ ] 3. Export all types
- [ ] 4. Create `types/navigation.ts`
- [ ] 5. Define RootTabParamList for tab navigation
- [ ] 6. Export navigation types

### API Service
- [ ] 7. Create `services/api.ts`
- [ ] 8. Import axios
- [ ] 9. **IMPORTANT**: Import API_URL from Expo environment variables (use `process.env.EXPO_PUBLIC_API_URL` or similar - Expo's native env handling)
- [ ] 10. Create axios instance with baseURL
- [ ] 11. Configure timeout (30 seconds)
- [ ] 12. Add response interceptor for errors
- [ ] 13. Create initiateBatchUpload function (same as web)
- [ ] 14. Create completePhotoUpload function
- [ ] 15. Create getUserPhotos function
- [ ] 16. Create getPhotoById function
- [ ] 17. Export all API functions
- [ ] 18. Add proper TypeScript types to all functions

### Upload Service
- [ ] 19. Create `services/upload.ts`
- [ ] 20. Import FileSystem from expo-file-system
- [ ] 21. Create uploadToS3 function for mobile
- [ ] 22. Use FileSystem.uploadAsync instead of XMLHttpRequest
- [ ] 23. Configure upload options (httpMethod: PUT)
- [ ] 24. Set uploadType to BINARY_CONTENT
- [ ] 25. Add headers with content-type
- [ ] 26. Track progress with uploadProgressCallback
- [ ] 27. Calculate percentage and call onProgress callback
- [ ] 28. Return Promise that resolves on completion
- [ ] 29. Handle errors properly
- [ ] 30. Export uploadToS3 function

### WebSocket Service (Adapted for React Native)
- [ ] 31. Create `services/websocket.ts`
- [ ] 32. Import Client from @stomp/stompjs
- [ ] 33. Import text-encoding polyfill
- [ ] 34. **IMPORTANT**: Import WS_URL from Expo environment variables (use `process.env.EXPO_PUBLIC_WS_URL` or similar)
- [ ] 35. Configure Client without SockJS (use native WebSocket)
- [ ] 36. Create createWebSocketClient function
- [ ] 37. Set webSocketFactory to return new WebSocket(url)
- [ ] 38. Configure reconnect delay
- [ ] 39. Add debug logging
- [ ] 40. Export createWebSocketClient

---

## PR #18: Mobile Hooks & State Management

### WebSocket Hook
- [ ] 1. Create `hooks/useWebSocket.ts`
- [ ] 2. Copy logic from web app useWebSocket hook
- [ ] 3. Adapt for React Native (same basic logic)
- [ ] 4. Use createWebSocketClient from mobile service
- [ ] 5. Subscribe to /user/queue/progress
- [ ] 6. Parse PhotoProgress messages
- [ ] 7. Update progress state Map
- [ ] 8. Create sendProgress callback
- [ ] 9. Return connected, progress, sendProgress
- [ ] 10. Export useWebSocket hook

### Throttled Progress Hook
- [ ] 11. Create `hooks/useThrottledProgress.ts`
- [ ] 12. Copy from web app (same implementation)
- [ ] 13. Accept sendProgress and throttleMs parameters
- [ ] 14. Implement throttling logic with timestamps
- [ ] 15. Return throttledSend function
- [ ] 16. Export useThrottledProgress hook

### Photo Upload Hook
- [ ] 17. Create `hooks/usePhotoUpload.ts`
- [ ] 18. Import useState, useCallback
- [ ] 19. Import API and upload services
- [ ] 20. Define usePhotoUpload hook (userId, onProgressUpdate)
- [ ] 21. Create uploading, error, uploadResults states
- [ ] 22. Create uploadPhotos callback
- [ ] 23. Map URIs to PhotoMetadata (need to get file info)
- [ ] 24. Use FileSystem.getInfoAsync to get file size
- [ ] 25. Call initiateBatchUpload API
- [ ] 26. For each URI and presigned URL:
- [ ] 27. Start upload with uploadToS3
- [ ] 28. Track progress locally
- [ ] 29. Call onProgressUpdate for WebSocket
- [ ] 30. On complete: call completePhotoUpload API
- [ ] 31. Update uploadResults Map
- [ ] 32. Handle errors for each upload
- [ ] 33. Use Promise.allSettled for concurrent uploads
- [ ] 34. Return uploading, error, uploadResults, uploadPhotos
- [ ] 35. Export usePhotoUpload hook

### Photo Gallery Hook
- [ ] 36. Create `hooks/usePhotoGallery.ts`
- [ ] 37. Copy logic from web app
- [ ] 38. Import getUserPhotos API
- [ ] 39. Create fetchPhotos function
- [ ] 40. Handle pagination state
- [ ] 41. Create loadMore function
- [ ] 42. Return photos, loading, error, pagination, loadMore, refetch
- [ ] 43. Export usePhotoGallery hook

---

## PR #19: Mobile UI Components

### Photo Picker Component
- [ ] 1. Create `components/PhotoPicker.tsx`
- [ ] 2. Import ImagePicker from expo-image-picker
- [ ] 3. Import Button, View, Text from react-native
- [ ] 4. Define props: onPhotosSelected: (uris: string[]) => void
- [ ] 5. Create requestPermissions function
- [ ] 6. Use ImagePicker.requestMediaLibraryPermissionsAsync()
- [ ] 7. Check if permission granted
- [ ] 8. Show alert if permission denied
- [ ] 9. Create handlePickPhotos callback
- [ ] 10. Call requestPermissions first
- [ ] 11. Launch ImagePicker.launchImageLibraryAsync()
- [ ] 12. Configure options: allowsMultipleSelection: true, mediaTypes: Images
- [ ] 13. Set quality: 1.0
- [ ] 14. Get selected assets from result
- [ ] 15. Extract URIs from assets
- [ ] 16. Validate max 100 photos
- [ ] 17. Call onPhotosSelected with URIs
- [ ] 18. Create handleTakePhoto callback for camera
- [ ] 19. Request camera permissions
- [ ] 20. Launch ImagePicker.launchCameraAsync()
- [ ] 21. Get photo URI from result
- [ ] 22. Call onPhotosSelected with single URI
- [ ] 23. Render View container
- [ ] 24. Render "Select from Gallery" button
- [ ] 25. Bind handlePickPhotos to button
- [ ] 26. Render "Take Photo" button
- [ ] 27. Bind handleTakePhoto to button
- [ ] 28. Apply StyleSheet styling
- [ ] 29. Make buttons visually distinct
- [ ] 30. Export PhotoPicker component

### Upload Progress Component
- [ ] 31. Create `components/UploadProgress.tsx`
- [ ] 32. Import View, Text, ActivityIndicator from react-native
- [ ] 33. Define props: fileName, progress, status
- [ ] 34. Create status icon helper (similar to web)
- [ ] 35. Use unicode symbols or ActivityIndicator
- [ ] 36. Render View container with flex row
- [ ] 37. Show status indicator on left
- [ ] 38. Show file name (truncate with ellipsis)
- [ ] 39. Render progress bar container View
- [ ] 40. Render filled progress bar View with dynamic width
- [ ] 41. Apply backgroundColor based on status
- [ ] 42. Show progress percentage text
- [ ] 43. Apply StyleSheet with proper spacing
- [ ] 44. Make responsive with flexbox
- [ ] 45. Export UploadProgress component

### Batch Progress Component
- [ ] 46. Create `components/BatchProgress.tsx`
- [ ] 47. Import View, Text from react-native
- [ ] 48. Define props: uploads Map
- [ ] 49. Calculate overall progress (same logic as web)
- [ ] 50. Count completed and failed
- [ ] 51. Render container View
- [ ] 52. Show "Uploading X of Y photos" title
- [ ] 53. Render large progress bar
- [ ] 54. Show overall percentage
- [ ] 55. Show completion stats
- [ ] 56. Apply StyleSheet styling
- [ ] 57. Export BatchProgress component

### Photo Grid Component
- [ ] 58. Create `components/PhotoGrid.tsx`
- [ ] 59. Import FlatList, Image, TouchableOpacity from react-native
- [ ] 60. Define props: photos array, onPhotoPress callback
- [ ] 61. Create renderItem function for FlatList
- [ ] 62. Render TouchableOpacity wrapper
- [ ] 63. Render Image with photo.downloadUrl
- [ ] 64. Apply resizeMode: 'cover'
- [ ] 65. Show file name below image
- [ ] 66. Show upload date
- [ ] 67. Show status badge
- [ ] 68. Bind onPhotoPress to TouchableOpacity
- [ ] 69. Configure FlatList with numColumns: 2
- [ ] 70. Add keyExtractor using photo.photoId
- [ ] 71. Apply styling with StyleSheet
- [ ] 72. Add spacing between items
- [ ] 73. Export PhotoGrid component

---

## PR #20: Mobile Screens

### Upload Screen
- [ ] 1. Create `app/tabs/upload.tsx`
- [ ] 2. Import React, useState
- [ ] 3. Import SafeAreaView, ScrollView, View, Text from react-native
- [ ] 4. Import PhotoPicker, UploadProgress, BatchProgress components
- [ ] 5. Import hooks: useWebSocket, usePhotoUpload, useThrottledProgress
- [ ] 6. Define mock userId constant
- [ ] 7. Initialize useWebSocket hook
- [ ] 8. Initialize useThrottledProgress
- [ ] 9. Initialize usePhotoUpload
- [ ] 10. Create selectedUris state
- [ ] 11. Create showProgress state
- [ ] 12. Create handlePhotosSelected callback
- [ ] 13. Set selectedUris state
- [ ] 14. Set showProgress to true
- [ ] 15. Call uploadPhotos with URIs
- [ ] 16. Create handleReset callback
- [ ] 17. Clear all state
- [ ] 18. Render SafeAreaView container
- [ ] 19. Render ScrollView for content
- [ ] 20. Show screen title: "Upload Photos"
- [ ] 21. Show WebSocket connection indicator
- [ ] 22. Conditionally render PhotoPicker if not uploading
- [ ] 23. Pass handlePhotosSelected to PhotoPicker
- [ ] 24. Conditionally render progress section
- [ ] 25. Render BatchProgress component
- [ ] 26. Map through uploadResults
- [ ] 27. Render UploadProgress for each photo
- [ ] 28. Show Reset button when done
- [ ] 29. Bind handleReset to button
- [ ] 30. Apply StyleSheet styling
- [ ] 31. Make layout responsive
- [ ] 32. Export default upload screen

### Gallery Screen
- [ ] 33. Create `app/tabs/gallery.tsx`
- [ ] 34. Import React
- [ ] 35. Import SafeAreaView, View, Text, Button, ActivityIndicator
- [ ] 36. Import PhotoGrid component
- [ ] 37. Import usePhotoGallery hook
- [ ] 38. Define mock userId
- [ ] 39. Initialize usePhotoGallery hook
- [ ] 40. Destructure photos, loading, error, loadMore, refetch
- [ ] 41. Create handleRefresh callback
- [ ] 42. Call refetch
- [ ] 43. Create handlePhotoPress callback
- [ ] 44. Open photo in full screen (use linking or modal)
- [ ] 45. Render SafeAreaView container
- [ ] 46. Show screen title: "My Photos"
- [ ] 47. Show refresh button
- [ ] 48. Bind handleRefresh to button
- [ ] 49. Show loading spinner if loading and no photos
- [ ] 50. Show error text if error
- [ ] 51. Show empty state if no photos
- [ ] 52. Render PhotoGrid component
- [ ] 53. Pass photos and handlePhotoPress
- [ ] 54. Render "Load More" button at bottom
- [ ] 55. Check if more pages exist
- [ ] 56. Bind loadMore to button
- [ ] 57. Disable while loading
- [ ] 58. Apply StyleSheet styling
- [ ] 59. Make fully responsive
- [ ] 60. Export default gallery screen

### Tab Navigation Layout
- [ ] 61. Create `app/tabs/_layout.tsx`
- [ ] 62. Import Tabs from expo-router
- [ ] 63. Import icons from a library or use emoji
- [ ] 64. Configure Tabs component
- [ ] 65. Define upload tab with icon and title
- [ ] 66. Define gallery tab with icon and title
- [ ] 67. Set initial route to upload
- [ ] 68. Configure tab bar styling
- [ ] 69. Set active tint color
- [ ] 70. Set inactive tint color
- [ ] 71. Export default tab layout

### Root Layout
- [ ] 72. Update `app/_layout.tsx`
- [ ] 73. Import Stack from expo-router
- [ ] 74. Configure Stack navigator
- [ ] 75. Set initial route
- [ ] 76. Configure screen options
- [ ] 77. Hide header for tabs
- [ ] 78. Export default root layout

### App Entry Point
- [ ] 79. Update `app/index.tsx`
- [ ] 80. Redirect to tabs route
- [ ] 81. Use expo-router Redirect component
- [ ] 82. Export default index