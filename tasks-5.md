# RapidPhotoUpload Tasks - Part 5: React Web UI Components

## PR #13: Upload Components & File Handling ✅ COMPLETE

### File Upload Hook
- [x] 1. Create `src/hooks/usePhotoUpload.ts`
- [x] 2. Import useState, useCallback
- [x] 3. Import API and upload service functions
- [x] 4. Import types: PhotoMetadata, PresignedUploadInfo
- [x] 5. Define hook: `usePhotoUpload(userId: string, onProgressUpdate: Function)`
- [x] 6. Create state: `uploading: boolean`
- [x] 7. Create state: `error: string | null`
- [x] 8. Create state: `uploadResults: Map<string, {status, progress}>`
- [x] 9. Create uploadPhotos callback function accepting File[]
- [x] 10. Set uploading to true at start
- [x] 11. Map files to PhotoMetadata objects
- [x] 12. Call initiateBatchUpload API with metadata
- [x] 13. Get BatchUploadResponse with presigned URLs
- [x] 14. For each file and corresponding presigned info:
- [x] 15. Start upload to S3 using uploadToS3()
- [x] 16. Pass progress callback that updates local state
- [x] 17. Call onProgressUpdate for WebSocket throttling
- [x] 18. On upload success: call completePhotoUpload API
- [x] 19. Update uploadResults Map with COMPLETED status
- [x] 20. On upload failure: update uploadResults with FAILED
- [x] 21. Use Promise.allSettled to handle all uploads
- [x] 22. Set uploading to false when all complete
- [x] 23. Add comprehensive error handling
- [x] 24. Return cleanup if component unmounts during upload
- [x] 25. Wrap in useCallback with dependencies
- [x] 26. Return object: `{ uploading, error, uploadResults, uploadPhotos }`
- [x] 27. Export usePhotoUpload hook

### Upload Zone Component
- [x] 28. Create `src/components/UploadZone.tsx`
- [x] 29. Import React, useState, useRef, DragEvent
- [x] 30. Define props interface: onFilesSelected: (files: File[]) => void
- [x] 31. Create state: `isDragging: boolean`
- [x] 32. Create ref: `fileInputRef: HTMLInputElement`
- [x] 33. Create handleDragOver handler (preventDefault, set isDragging true)
- [x] 34. Create handleDragLeave handler (set isDragging false)
- [x] 35. Create handleDrop handler
- [x] 36. Prevent default behavior
- [x] 37. Set isDragging false
- [x] 38. Get files from dataTransfer.files
- [x] 39. Filter for image files only (image/*)
- [x] 40. Validate max 100 files
- [x] 41. Call onFilesSelected with valid files
- [x] 42. Create handleFileInput handler
- [x] 43. Get files from input element
- [x] 44. Convert FileList to Array
- [x] 45. Call onFilesSelected
- [x] 46. Create handleClick to trigger file input
- [x] 47. Render drag-drop area with Tailwind styling
- [x] 48. Show upload icon (lucide-react Upload icon)
- [x] 49. Show "Drag and drop photos here" text
- [x] 50. Show "or click to select files" subtext
- [x] 51. Apply conditional styling when isDragging (border color, bg color)
- [x] 52. Render hidden file input with multiple and accept="image/*"
- [x] 53. Bind all event handlers
- [x] 54. Export UploadZone component

### Progress Indicator Component
- [x] 55. Create `src/components/ProgressIndicator.tsx`
- [x] 56. Define props interface: fileName, progress (0-100), status
- [x] 57. Import lucide-react icons: CheckCircle, XCircle, Loader2
- [x] 58. Create status icon helper function
- [x] 59. Return CheckCircle for COMPLETED (green)
- [x] 60. Return XCircle for FAILED (red)
- [x] 61. Return Loader2 for UPLOADING (spinning animation)
- [x] 62. Return Clock for PENDING (gray)
- [x] 63. Render container div with flex layout
- [x] 64. Show status icon on left
- [x] 65. Show file name (truncate if too long)
- [x] 66. Render progress bar container
- [x] 67. Render filled progress bar with width based on progress %
- [x] 68. Apply color based on status (blue=uploading, green=completed, red=failed)
- [x] 69. Show progress percentage text on right
- [x] 70. Apply Tailwind styling for clean layout
- [x] 71. Export ProgressIndicator component

### Batch Progress Component
- [x] 72. Create `src/components/BatchProgress.tsx`
- [x] 73. Define props interface: uploads Map<string, {fileName, progress, status}>
- [x] 74. Calculate overall progress percentage
- [x] 75. Sum all individual progress values
- [x] 76. Divide by total number of uploads
- [x] 77. Count completed uploads
- [x] 78. Count failed uploads
- [x] 79. Render batch summary card
- [x] 80. Show "Uploading X of Y photos" title
- [x] 81. Render large progress bar for batch
- [x] 82. Show overall percentage
- [x] 83. Show count: "X completed, Y failed" if any failures
- [x] 84. Apply Tailwind styling for card appearance
- [x] 85. Export BatchProgress component

---

## PR #14: Upload Page & Integration

### Upload Page Component
- [ ] 1. Create `src/pages/UploadPage.tsx`
- [ ] 2. Import all hooks: useWebSocket, usePhotoUpload, useThrottledProgress
- [ ] 3. Import components: UploadZone, ProgressIndicator, BatchProgress
- [ ] 4. Define mock userId constant (for MVP: hardcoded UUID)
- [ ] 5. Initialize useWebSocket hook with userId
- [ ] 6. Initialize useThrottledProgress with sendProgress from WebSocket
- [ ] 7. Initialize usePhotoUpload with userId and throttled progress callback
- [ ] 8. Create state: `selectedFiles: File[]`
- [ ] 9. Create state: `showProgress: boolean`
- [ ] 10. Create handleFilesSelected callback
- [ ] 11. Set selectedFiles state
- [ ] 12. Set showProgress to true
- [ ] 13. Call uploadPhotos from usePhotoUpload hook
- [ ] 14. Create handleReset callback to clear state and start over
- [ ] 15. Render page container with padding and max-width
- [ ] 16. Render page title: "Upload Photos"
- [ ] 17. Show WebSocket connection status indicator (green dot if connected)
- [ ] 18. Conditionally render UploadZone if not uploading
- [ ] 19. Pass handleFilesSelected to UploadZone
- [ ] 20. Conditionally render progress section if showProgress
- [ ] 21. Render BatchProgress component with uploadResults
- [ ] 22. Render list of ProgressIndicator components
- [ ] 23. Map through selectedFiles and uploadResults
- [ ] 24. Pass fileName, progress, status to each ProgressIndicator
- [ ] 25. Merge local upload progress with WebSocket progress updates
- [ ] 26. Show "Reset" button when all uploads complete
- [ ] 27. Bind handleReset to button
- [ ] 28. Add loading spinner if uploading
- [ ] 29. Show error message if error exists
- [ ] 30. Apply responsive Tailwind styling
- [ ] 31. Export UploadPage component

### App Router Configuration
- [ ] 32. Update `src/App.tsx`
- [ ] 33. Import BrowserRouter, Routes, Route from react-router-dom
- [ ] 34. Import UploadPage component
- [ ] 35. Remove default Vite boilerplate
- [ ] 36. Wrap app in BrowserRouter
- [ ] 37. Define Routes component
- [ ] 38. Add Route for "/" path to UploadPage
- [ ] 39. Add Route for "/upload" path to UploadPage (same component)
- [ ] 40. Add placeholder Route for "/gallery" (to be implemented)
- [ ] 41. Export App component

### Navigation Component
- [ ] 42. Create `src/components/Navigation.tsx`
- [ ] 43. Import Link from react-router-dom
- [ ] 44. Import lucide-react icons: Upload, Image
- [ ] 45. Render nav bar with flex layout
- [ ] 46. Add app logo/title on left
- [ ] 47. Add navigation links: Upload, Gallery
- [ ] 48. Use Link component for routing
- [ ] 49. Highlight active route based on current path
- [ ] 50. Apply Tailwind styling for nav appearance
- [ ] 51. Make responsive for mobile (hamburger menu optional)
- [ ] 52. Export Navigation component
- [ ] 53. Import Navigation in App.tsx
- [ ] 54. Render Navigation above Routes

---

## PR #15: Photo Gallery Page

### Gallery Hook
- [ ] 1. Create `src/hooks/usePhotoGallery.ts`
- [ ] 2. Import useState, useEffect, useCallback
- [ ] 3. Import getUserPhotos API function
- [ ] 4. Import types: Photo, PhotoQueryResponse
- [ ] 5. Define hook: `usePhotoGallery(userId: string)`
- [ ] 6. Create state: `photos: Photo[]`
- [ ] 7. Create state: `loading: boolean`
- [ ] 8. Create state: `error: string | null`
- [ ] 9. Create state: `currentPage: number`
- [ ] 10. Create state: `totalPages: number`
- [ ] 11. Create fetchPhotos callback function
- [ ] 12. Set loading true
- [ ] 13. Call getUserPhotos API with page and size (20)
- [ ] 14. Update photos state with response.photos
- [ ] 15. Update pagination state (currentPage, totalPages)
- [ ] 16. Set loading false
- [ ] 17. Handle errors and update error state
- [ ] 18. Wrap in useCallback with dependencies
- [ ] 19. Create useEffect to fetch photos on mount
- [ ] 20. Call fetchPhotos()
- [ ] 21. Add userId to dependency array
- [ ] 22. Create loadMore callback for pagination
- [ ] 23. Increment currentPage
- [ ] 24. Call fetchPhotos with new page
- [ ] 25. Append new photos to existing array
- [ ] 26. Return object: `{ photos, loading, error, currentPage, totalPages, loadMore, refetch: fetchPhotos }`
- [ ] 27. Export usePhotoGallery hook

### Photo Card Component
- [ ] 28. Create `src/components/PhotoCard.tsx`
- [ ] 29. Define props interface: photo (Photo type)
- [ ] 30. Import lucide-react icons: Download, Calendar
- [ ] 31. Create handleDownload callback
- [ ] 32. Open photo.downloadUrl in new tab
- [ ] 33. Format file size (bytes to KB/MB)
- [ ] 34. Format upload date (use Intl.DateTimeFormat or date-fns)
- [ ] 35. Render card container with border and shadow
- [ ] 36. Render image with photo.downloadUrl as src
- [ ] 37. Apply object-cover and aspect-ratio styling
- [ ] 38. Show loading skeleton while image loads
- [ ] 39. Render photo metadata section below image
- [ ] 40. Show file name (truncate if long)
- [ ] 41. Show file size
- [ ] 42. Show upload date with calendar icon
- [ ] 43. Show upload status badge (colored based on status)
- [ ] 44. Render download button with icon
- [ ] 45. Bind handleDownload to button click
- [ ] 46. Disable download if status is not COMPLETED
- [ ] 47. Apply Tailwind styling for card appearance
- [ ] 48. Add hover effects (scale, shadow)
- [ ] 49. Make card responsive
- [ ] 50. Export PhotoCard component

### Gallery Page Component
- [ ] 51. Create `src/pages/GalleryPage.tsx`
- [ ] 52. Import usePhotoGallery hook
- [ ] 53. Import PhotoCard component
- [ ] 54. Import lucide-react icons: RefreshCw, ImageOff
- [ ] 55. Define mock userId (same as UploadPage)
- [ ] 56. Initialize usePhotoGallery hook
- [ ] 57. Destructure photos, loading, error, loadMore, refetch
- [ ] 58. Create handleRefresh callback
- [ ] 59. Call refetch to reload photos
- [ ] 60. Render page container with padding
- [ ] 61. Render page title: "My Photos"
- [ ] 62. Add refresh button that calls handleRefresh
- [ ] 63. Show loading spinner if loading and no photos
- [ ] 64. Show error message if error exists
- [ ] 65. Show empty state if no photos (ImageOff icon + message)
- [ ] 66. Render photo grid with CSS Grid or Flexbox
- [ ] 67. Set responsive columns (1 on mobile, 2 on tablet, 3-4 on desktop)
- [ ] 68. Map through photos array
- [ ] 69. Render PhotoCard for each photo
- [ ] 70. Pass photo prop to PhotoCard
- [ ] 71. Add "Load More" button at bottom if more pages exist
- [ ] 72. Check if currentPage < totalPages
- [ ] 73. Bind loadMore to button click
- [ ] 74. Disable button while loading
- [ ] 75. Show loading spinner on button when loading more
- [ ] 76. Apply Tailwind styling for grid and layout
- [ ] 77. Make fully responsive
- [ ] 78. Export GalleryPage component

### Update App Router
- [ ] 79. Import GalleryPage in `src/App.tsx`
- [ ] 80. Update Route for "/gallery" path
- [ ] 81. Set element to GalleryPage component
- [ ] 82. Test navigation between Upload and Gallery pages