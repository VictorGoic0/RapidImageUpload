# RapidPhotoUpload Tasks - Part 6: React Native Mobile App

## PR #16: React Native Project Setup

### Expo Project Initialization
- [x] 1. Navigate to root directory: `cd rapidphoto`
- [x] 2. Create Expo app: `npx create-expo-app@latest mobile-client --template blank-typescript`
- [x] 3. Navigate to mobile-client: `cd mobile-client`
- [x] 4. **IMPORTANT**: Verify React version is 19 - check `package.json` and ensure React 19.1.0: `npm install react@19.1.0 react-dom@19.1.0`
- [x] 5. **IMPORTANT**: Install React Native version compatible with React 19: Use React Native 0.81.4: `npx expo install react-native@0.81.4`
- [x] 6. Install Expo Router: `npx expo install expo-router react-native-safe-area-context react-native-screens`
- [x] 7. Install image picker: `npx expo install expo-image-picker`
- [x] 8. Install file system: `npx expo install expo-file-system`
- [x] 9. Install Axios: `npm install axios`
- [x] 10. Install WebSocket: `npm install @stomp/stompjs`
- [x] 11. Install polyfills: `npm install text-encoding`
- [x] 12. **IMPORTANT**: Install react-native-web for web testing: `npm install react-native-web`
- [x] 13. Update `package.json` to include expo-router entry point

### Expo Configuration
- [x] 14. Update `app.json` with app name: "RapidPhoto"
- [x] 15. Add scheme: "rapidphoto" for deep linking
- [x] 16. Configure iOS bundle identifier
- [x] 17. Configure Android package name
- [x] 18. Add permissions for camera and photo library
- [x] 19. Set up splash screen and icon (use defaults for now)
- [x] 20. Configure orientation (portrait preferred)
- [x] 21. **IMPORTANT**: Configure web platform support in `app.json` for testing (add web configuration)

### Project Structure
- [x] 22. Create `app/tabs/` directory for tab navigation
- [x] 23. Create `app/tabs/_layout.tsx` for tab configuration
- [x] 24. Create `app/tabs/upload.tsx` for upload screen
- [x] 25. Create `app/tabs/gallery.tsx` for gallery screen
- [x] 26. Create `components/` directory
- [x] 27. Create `hooks/` directory
- [x] 28. Create `services/` directory
- [x] 29. Create `types/` directory
- [x] 30. Create `constants/` directory
- [x] 31. **IMPORTANT**: Set up Expo environment variables (NOT react-native-dotenv)
- [x] 32. Create `.env` file with API_URL and WS_URL (Expo will handle this automatically)
- [x] 33. Configure environment variables in `app.json` or use `process.env` (Expo handles env vars natively)
- [x] 34. **DO NOT** install react-native-dotenv - Expo handles environment variables internally

---

## PR #17: Mobile Services & Type Definitions

### Type Definitions
- [x] 1. Create `types/photo.ts` (copy from web app)
- [x] 2. Define same interfaces: PhotoMetadata, Photo, PhotoProgress, etc.
- [x] 3. Export all types
- [x] 4. Create `types/navigation.ts`
- [x] 5. Define RootTabParamList for tab navigation
- [x] 6. Export navigation types

### API Service
- [x] 7. Create `services/api.ts`
- [x] 8. Import axios
- [x] 9. **IMPORTANT**: Import API_URL from Expo environment variables (use `process.env.EXPO_PUBLIC_API_URL` or similar - Expo's native env handling)
- [x] 10. Create axios instance with baseURL
- [x] 11. Configure timeout (30 seconds)
- [x] 12. Add response interceptor for errors
- [x] 13. Create initiateBatchUpload function (same as web)
- [x] 14. Create completePhotoUpload function
- [x] 15. Create getUserPhotos function
- [x] 16. Create getPhotoById function
- [x] 17. Export all API functions
- [x] 18. Add proper TypeScript types to all functions

### Upload Service
- [x] 19. Create `services/upload.ts`
- [x] 20. Import FileSystem from expo-file-system
- [x] 21. Create uploadToS3 function for mobile
- [x] 22. Use FileSystem.uploadAsync instead of XMLHttpRequest
- [x] 23. Configure upload options (httpMethod: PUT)
- [x] 24. Set uploadType to BINARY_CONTENT
- [x] 25. Add headers with content-type
- [x] 26. Track progress with uploadProgressCallback
- [x] 27. Calculate percentage and call onProgress callback
- [x] 28. Return Promise that resolves on completion
- [x] 29. Handle errors properly
- [x] 30. Export uploadToS3 function

### WebSocket Service (Adapted for React Native)
- [x] 31. Create `services/websocket.ts`
- [x] 32. Import Client from @stomp/stompjs
- [x] 33. Import text-encoding polyfill
- [x] 34. **IMPORTANT**: Import WS_URL from Expo environment variables (use `process.env.EXPO_PUBLIC_WS_URL` or similar)
- [x] 35. Configure Client without SockJS (use native WebSocket)
- [x] 36. Create createWebSocketClient function
- [x] 37. Set webSocketFactory to return new WebSocket(url)
- [x] 38. Configure reconnect delay
- [x] 39. Add debug logging
- [x] 40. Export createWebSocketClient

---

## PR #18: Mobile Hooks & State Management

### WebSocket Hook
- [x] 1. Create `hooks/useWebSocket.ts`
- [x] 2. Copy logic from web app useWebSocket hook
- [x] 3. Adapt for React Native (same basic logic)
- [x] 4. Use createWebSocketClient from mobile service
- [x] 5. Subscribe to /user/queue/progress
- [x] 6. Parse PhotoProgress messages
- [x] 7. Update progress state Map
- [x] 8. Create sendProgress callback
- [x] 9. Return connected, progress, sendProgress
- [x] 10. Export useWebSocket hook

### Throttled Progress Hook
- [x] 11. Create `hooks/useThrottledProgress.ts`
- [x] 12. Copy from web app (same implementation)
- [x] 13. Accept sendProgress and throttleMs parameters
- [x] 14. Implement throttling logic with timestamps
- [x] 15. Return throttledSend function
- [x] 16. Export useThrottledProgress hook

### Photo Upload Hook
- [x] 17. Create `hooks/usePhotoUpload.ts`
- [x] 18. Import useState, useCallback
- [x] 19. Import API and upload services
- [x] 20. Define usePhotoUpload hook (userId, onProgressUpdate)
- [x] 21. Create uploading, error, uploadResults states
- [x] 22. Create uploadPhotos callback
- [x] 23. Map URIs to PhotoMetadata (need to get file info)
- [x] 24. Use FileSystem.getInfoAsync to get file size
- [x] 25. Call initiateBatchUpload API
- [x] 26. For each URI and presigned URL:
- [x] 27. Start upload with uploadToS3
- [x] 28. Track progress locally
- [x] 29. Call onProgressUpdate for WebSocket
- [x] 30. On complete: call completePhotoUpload API
- [x] 31. Update uploadResults Map
- [x] 32. Handle errors for each upload
- [x] 33. Use Promise.allSettled for concurrent uploads
- [x] 34. Return uploading, error, uploadResults, uploadPhotos
- [x] 35. Export usePhotoUpload hook

### Photo Gallery Hook
- [x] 36. Create `hooks/usePhotoGallery.ts`
- [x] 37. Copy logic from web app
- [x] 38. Import getUserPhotos API
- [x] 39. Create fetchPhotos function
- [x] 40. Handle pagination state
- [x] 41. Create loadMore function
- [x] 42. Return photos, loading, error, pagination, loadMore, refetch
- [x] 43. Export usePhotoGallery hook

---

## PR #19: Mobile UI Components

### Photo Picker Component
- [x] 1. Create `components/PhotoPicker.tsx`
- [x] 2. Import ImagePicker from expo-image-picker
- [x] 3. Import Button, View, Text from react-native
- [x] 4. Define props: onPhotosSelected: (uris: string[]) => void
- [x] 5. Create requestPermissions function
- [x] 6. Use ImagePicker.requestMediaLibraryPermissionsAsync()
- [x] 7. Check if permission granted
- [x] 8. Show alert if permission denied
- [x] 9. Create handlePickPhotos callback
- [x] 10. Call requestPermissions first
- [x] 11. Launch ImagePicker.launchImageLibraryAsync()
- [x] 12. Configure options: allowsMultipleSelection: true, mediaTypes: Images
- [x] 13. Set quality: 1.0
- [x] 14. Get selected assets from result
- [x] 15. Extract URIs from assets
- [x] 16. Validate max 100 photos
- [x] 17. Call onPhotosSelected with URIs
- [x] 18. Create handleTakePhoto callback for camera
- [x] 19. Request camera permissions
- [x] 20. Launch ImagePicker.launchCameraAsync()
- [x] 21. Get photo URI from result
- [x] 22. Call onPhotosSelected with single URI
- [x] 23. Render View container
- [x] 24. Render "Select from Gallery" button
- [x] 25. Bind handlePickPhotos to button
- [x] 26. Render "Take Photo" button
- [x] 27. Bind handleTakePhoto to button
- [x] 28. Apply StyleSheet styling
- [x] 29. Make buttons visually distinct
- [x] 30. Export PhotoPicker component

### Upload Progress Component
- [x] 31. Create `components/UploadProgress.tsx`
- [x] 32. Import View, Text, ActivityIndicator from react-native
- [x] 33. Define props: fileName, progress, status
- [x] 34. Create status icon helper (similar to web)
- [x] 35. Use unicode symbols or ActivityIndicator
- [x] 36. Render View container with flex row
- [x] 37. Show status indicator on left
- [x] 38. Show file name (truncate with ellipsis)
- [x] 39. Render progress bar container View
- [x] 40. Render filled progress bar View with dynamic width
- [x] 41. Apply backgroundColor based on status
- [x] 42. Show progress percentage text
- [x] 43. Apply StyleSheet with proper spacing
- [x] 44. Make responsive with flexbox
- [x] 45. Export UploadProgress component

### Batch Progress Component
- [x] 46. Create `components/BatchProgress.tsx`
- [x] 47. Import View, Text from react-native
- [x] 48. Define props: uploads Map
- [x] 49. Calculate overall progress (same logic as web)
- [x] 50. Count completed and failed
- [x] 51. Render container View
- [x] 52. Show "Uploading X of Y photos" title
- [x] 53. Render large progress bar
- [x] 54. Show overall percentage
- [x] 55. Show completion stats
- [x] 56. Apply StyleSheet styling
- [x] 57. Export BatchProgress component

### Photo Grid Component
- [x] 58. Create `components/PhotoGrid.tsx`
- [x] 59. Import FlatList, Image, TouchableOpacity from react-native
- [x] 60. Define props: photos array, onPhotoPress callback
- [x] 61. Create renderItem function for FlatList
- [x] 62. Render TouchableOpacity wrapper
- [x] 63. Render Image with photo.downloadUrl
- [x] 64. Apply resizeMode: 'cover'
- [x] 65. Show file name below image
- [x] 66. Show upload date
- [x] 67. Show status badge
- [x] 68. Bind onPhotoPress to TouchableOpacity
- [x] 69. Configure FlatList with numColumns: 2
- [x] 70. Add keyExtractor using photo.photoId
- [x] 71. Apply styling with StyleSheet
- [x] 72. Add spacing between items
- [x] 73. Export PhotoGrid component

---

## PR #20: Mobile Screens

### Upload Screen
- [x] 1. Create `app/tabs/upload.tsx`
- [x] 2. Import React, useState
- [x] 3. Import SafeAreaView, ScrollView, View, Text from react-native
- [x] 4. Import PhotoPicker, UploadProgress, BatchProgress components
- [x] 5. Import hooks: useWebSocket, usePhotoUpload, useThrottledProgress
- [x] 6. Define mock userId constant
- [x] 7. Initialize useWebSocket hook
- [x] 8. Initialize useThrottledProgress
- [x] 9. Initialize usePhotoUpload
- [x] 10. Create selectedUris state
- [x] 11. Create showProgress state
- [x] 12. Create handlePhotosSelected callback
- [x] 13. Set selectedUris state
- [x] 14. Set showProgress to true
- [x] 15. Call uploadPhotos with URIs
- [x] 16. Create handleReset callback
- [x] 17. Clear all state
- [x] 18. Render SafeAreaView container
- [x] 19. Render ScrollView for content
- [x] 20. Show screen title: "Upload Photos"
- [x] 21. Show WebSocket connection indicator
- [x] 22. Conditionally render PhotoPicker if not uploading
- [x] 23. Pass handlePhotosSelected to PhotoPicker
- [x] 24. Conditionally render progress section
- [x] 25. Render BatchProgress component
- [x] 26. Map through uploadResults
- [x] 27. Render UploadProgress for each photo
- [x] 28. Show Reset button when done
- [x] 29. Bind handleReset to button
- [x] 30. Apply StyleSheet styling
- [x] 31. Make layout responsive
- [x] 32. Export default upload screen

### Gallery Screen
- [x] 33. Create `app/tabs/gallery.tsx`
- [x] 34. Import React
- [x] 35. Import SafeAreaView, View, Text, Button, ActivityIndicator
- [x] 36. Import PhotoGrid component
- [x] 37. Import usePhotoGallery hook
- [x] 38. Define mock userId
- [x] 39. Initialize usePhotoGallery hook
- [x] 40. Destructure photos, loading, error, loadMore, refetch
- [x] 41. Create handleRefresh callback
- [x] 42. Call refetch
- [x] 43. Create handlePhotoPress callback
- [x] 44. Open photo in full screen (use linking or modal)
- [x] 45. Render SafeAreaView container
- [x] 46. Show screen title: "My Photos"
- [x] 47. Show refresh button
- [x] 48. Bind handleRefresh to button
- [x] 49. Show loading spinner if loading and no photos
- [x] 50. Show error text if error
- [x] 51. Show empty state if no photos
- [x] 52. Render PhotoGrid component
- [x] 53. Pass photos and handlePhotoPress
- [x] 54. Render "Load More" button at bottom
- [x] 55. Check if more pages exist
- [x] 56. Bind loadMore to button
- [x] 57. Disable while loading
- [x] 58. Apply StyleSheet styling
- [x] 59. Make fully responsive
- [x] 60. Export default gallery screen

### Tab Navigation Layout
- [x] 61. Create `app/tabs/_layout.tsx`
- [x] 62. Import Tabs from expo-router
- [x] 63. Import icons from a library or use emoji
- [x] 64. Configure Tabs component
- [x] 65. Define upload tab with icon and title
- [x] 66. Define gallery tab with icon and title
- [x] 67. Set initial route to upload
- [x] 68. Configure tab bar styling
- [x] 69. Set active tint color
- [x] 70. Set inactive tint color
- [x] 71. Export default tab layout

### Root Layout
- [x] 72. Update `app/_layout.tsx`
- [x] 73. Import Stack from expo-router
- [x] 74. Configure Stack navigator
- [x] 75. Set initial route
- [x] 76. Configure screen options
- [x] 77. Hide header for tabs
- [x] 78. Export default root layout

### App Entry Point
- [x] 79. Update `app/index.tsx`
- [x] 80. Redirect to tabs route
- [x] 81. Use expo-router Redirect component
- [x] 82. Export default index