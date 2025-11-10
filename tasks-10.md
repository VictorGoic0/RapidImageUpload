# RapidPhotoUpload Tasks - Part 10: Delete & Authentication

## PR #25: Photo Delete Functionality

### Backend - Delete Photo Feature (VSA)

#### Domain Layer
- [x] 1. No changes needed to Photo entity (existing methods sufficient)
- [x] 2. Verify PhotoRepository has `findByIdAndUserId` method (already exists)
- [x] 3. Verify PhotoRepository extends JpaRepository with delete capability

#### S3 Service Enhancement
- [x] 4. Navigate to `backend/src/main/java/com/rapidphoto/infrastructure/s3/S3Service.java`
- [x] 5. Add `deleteObject(String key)` method
- [x] 6. Implement using S3Client.deleteObject()
- [x] 7. Add try-catch for S3Exception
- [x] 8. If object doesn't exist (NoSuchKeyException), log warning but return successfully
- [x] 9. Add logging for successful deletion
- [x] 10. Add logging for errors (other than NoSuchKeyException)

#### Photo Delete Feature (CQRS Command)
- [x] 11. Create `backend/src/main/java/com/rapidphoto/features/photodelete/` directory
- [x] 12. Create `DeletePhotoCommand.java` record
- [x] 13. Add fields: PhotoId photoId, UserId userId (for authorization)
- [x] 14. Create `DeletePhotoCommandHandler.java`
- [x] 15. Inject PhotoRepository and S3Service
- [x] 16. Implement `handle(DeletePhotoCommand command)` method
- [x] 17. Find photo by ID (use PhotoRepository.findById)
- [x] 18. If photo not found, throw PhotoNotFoundException
- [x] 19. If found, attempt to delete from S3 (use photo.getS3Key())
- [x] 20. If S3 deletion fails with NoSuchKeyException, log warning and continue
- [x] 21. If S3 deletion fails with other exception, log error and continue (fallback strategy)
- [x] 22. Delete photo from database (PhotoRepository.delete)
- [x] 23. Log successful deletion
- [x] 24. Return void (or DeletePhotoResponse if we want confirmation)

#### Delete Photo Controller
- [x] 25. Create `DeletePhotoController.java` in `features/photodelete/`
- [x] 26. Add @RestController and @RequestMapping("/api/photos")
- [x] 27. Inject DeletePhotoCommandHandler
- [x] 28. Create DELETE endpoint: `@DeleteMapping("/{photoId}")`
- [x] 29. Accept @PathVariable String photoId (no userId check for MVP)
- [x] 30. Convert photoId to PhotoId object
- [x] 31. Create DeletePhotoCommand (use a default/mock userId for now)
- [x] 32. Call commandHandler.handle(command)
- [x] 33. Return ResponseEntity.noContent() (204 No Content)
- [x] 34. Add exception handling for PhotoNotFoundException (404)
- [x] 35. Add exception handling for IllegalArgumentException (400)
- [x] 36. Add exception handling for general exceptions (500)
- [x] 37. Add logging for delete requests

---

### Web Client - Delete Functionality

#### API Service
- [x] 38. Navigate to `web-client/src/services/api.ts`
- [x] 39. Add `deletePhoto(photoId: string)` function
- [x] 40. Implement DELETE request to `/api/photos/${photoId}`
- [x] 41. Return Promise<void>
- [x] 42. Add error handling and logging

#### Photo Card Component
- [x] 43. Navigate to `web-client/src/components/PhotoCard.tsx`
- [x] 44. Add delete button with trash icon (lucide-react Trash2 icon)
- [x] 45. Position delete button to the right of photo title
- [x] 46. Add CSS to truncate title if it would push button outside container
- [x] 47. Style button to be low-profile (small, subtle color)
- [x] 48. Add onClick handler to open confirmation modal
- [x] 49. Add state for confirmation modal open/closed

#### Delete Confirmation Modal
- [x] 50. Create `web-client/src/components/DeleteConfirmationModal.tsx`
- [x] 51. Use shadcn/ui Dialog component
- [x] 52. Add title: "Delete Photo"
- [x] 53. Add message: "Are you sure you want to delete this photo? This action cannot be undone."
- [x] 54. Add Cancel button (closes modal)
- [x] 55. Add Delete button (styled as destructive/danger)
- [x] 56. Accept onConfirm callback prop
- [x] 57. Accept onCancel callback prop
- [x] 58. Accept isOpen prop

#### Gallery Page Integration
- [x] 59. Navigate to `web-client/src/pages/GalleryPage.tsx`
- [x] 60. Add delete handler function `handleDeletePhoto(photoId: string)`
- [x] 61. Call deletePhoto API function
- [x] 62. On success, optimistically remove photo from photos state
- [x] 63. Filter out deleted photo: `setPhotos(prev => prev.filter(p => p.id !== photoId))`
- [x] 64. Add error handling (log error, could show toast in future)
- [x] 65. Pass delete handler to PhotoCard components

---

### Mobile Client - Delete Functionality

#### API Service
- [x] 66. Navigate to `mobile-client/services/api.ts`
- [x] 67. Add `deletePhoto(photoId: string)` function
- [x] 68. Implement DELETE request to `/api/photos/${photoId}`
- [x] 69. Return Promise<void>
- [x] 70. Add error handling and logging

#### Photo Grid Component
- [x] 71. Navigate to `mobile-client/components/PhotoGrid.tsx`
- [x] 72. Add long-press handler to photo cards (use React Native onLongPress)
- [x] 73. On long press, trigger confirmation alert
- [x] 74. Create state for selected photo ID

#### Delete Confirmation
- [x] 75. Use React Native Alert.alert for confirmation
- [x] 76. Title: "Delete Photo"
- [x] 77. Message: "Do you want to delete this photo?"
- [x] 78. Buttons: "Cancel" and "Delete"
- [x] 79. On Delete press, call delete handler

#### Gallery Screen Integration
- [x] 80. Navigate to `mobile-client/app/tabs/gallery.tsx`
- [x] 81. Add delete handler function `handleDeletePhoto(photoId: string)`
- [x] 82. Call deletePhoto API function
- [x] 83. On success, optimistically remove photo from photos state
- [x] 84. Filter out deleted photo: `setPhotos(prev => prev.filter(p => p.id !== photoId))`
- [x] 85. Add error handling (log error)
- [x] 86. Pass delete handler to PhotoGrid component

---

## PR #26: Mocked User Authentication

### Backend - User Entity & Repository

#### Domain Layer - User Model
- [x] 1. Create `backend/src/main/java/com/rapidphoto/domain/User.java` entity
- [x] 2. Add @Entity and @Table(name = "users")
- [x] 3. Add @Id @GeneratedValue UUID id field
- [x] 4. Add @Column(unique = true, nullable = false) String username
- [x] 5. Add @Column(nullable = false) String password (plain text for MVP)
- [x] 6. Add @CreationTimestamp LocalDateTime createdAt
- [x] 7. Add default constructor (protected)
- [x] 8. Add constructor with username and password
- [x] 9. Add static factory method `create(String username, String password)`
- [x] 10. Add getters for all fields
- [x] 11. Add equals and hashCode based on id

#### Repository
- [x] 12. Create `backend/src/main/java/com/rapidphoto/domain/UserRepository.java`
- [x] 13. Extend JpaRepository<User, UUID>
- [x] 14. Add method: `Optional<User> findByUsername(String username)`
- [x] 15. Add method: `boolean existsByUsername(String username)`

#### Database Schema Migration
- [x] 15a. **No manual migration required** - JPA `ddl-auto: update` handles schema changes automatically
- [x] 15b. On application startup, Hibernate will:
  - Create `users` table if it doesn't exist (with columns: id, username, password, created_at)
  - Add foreign key constraint `fk_photo_user` to `photos.user_id` column (if not already present)
  - Existing photos with mock user IDs will remain valid (they reference valid UUIDs)
- [x] 15c. **Testing**: Simply start the application once to trigger schema creation/update
  - No SQL scripts or migration tools needed
  - Schema changes happen automatically on first startup after code changes
  - Verify by checking database: `SELECT * FROM users;` and `\d photos;` (PostgreSQL)

---

### Backend - Auth Feature (VSA)

#### Auth Commands & Handlers
- [x] 16. Create `backend/src/main/java/com/rapidphoto/features/auth/` directory
- [x] 17. Create `RegisterUserCommand.java` record (username, password)
- [x] 18. Create `RegisterUserCommandHandler.java`
- [x] 19. Inject UserRepository
- [x] 20. Check if username already exists (throw exception if exists)
- [x] 21. Create User entity with User.create()
- [x] 22. Save to UserRepository
- [x] 23. Return RegisterUserResponse (userId, username)
- [x] 24. Create `LoginUserCommand.java` record (username, password)
- [x] 25. Create `LoginUserCommandHandler.java`
- [x] 26. Inject UserRepository
- [x] 27. Find user by username
- [x] 28. If not found, throw AuthenticationException
- [x] 29. Compare plain text passwords (simple equality check)
- [x] 30. If passwords don't match, throw AuthenticationException
- [x] 31. Return LoginUserResponse (userId, username)

#### Response DTOs
- [x] 32. Create `RegisterUserResponse.java` record (UUID userId, String username)
- [x] 33. Create `LoginUserResponse.java` record (UUID userId, String username)

#### Auth Controller
- [x] 34. Create `AuthController.java` in `features/auth/`
- [x] 35. Add @RestController and @RequestMapping("/api/auth")
- [x] 36. Inject RegisterUserCommandHandler and LoginUserCommandHandler
- [x] 37. Create POST endpoint: `@PostMapping("/register")`
- [x] 38. Accept @RequestBody RegisterRequest (username, password)
- [x] 39. Create RegisterUserCommand
- [x] 40. Call handler, return RegisterUserResponse (201 Created)
- [x] 41. Add exception handling for duplicate username (409 Conflict)
- [x] 42. Create POST endpoint: `@PostMapping("/login")`
- [x] 43. Accept @RequestBody LoginRequest (username, password)
- [x] 44. Create LoginUserCommand
- [x] 45. Call handler, return LoginUserResponse (200 OK)
- [x] 46. Add exception handling for invalid credentials (401 Unauthorized)
- [x] 47. Add logging for auth operations

#### Request DTOs
- [x] 48. Create inner record `RegisterRequest(String username, String password)` in controller
- [x] 49. Create inner record `LoginRequest(String username, String password)` in controller
- [x] 50. Add @Valid validation annotations if desired

---

### Web Client - Auth UI & State

#### Auth Service
- [ ] 51. Create `web-client/src/services/auth.ts`
- [ ] 52. Add `register(username: string, password: string)` function
- [ ] 53. POST to `/api/auth/register`, return { userId, username }
- [ ] 54. Add `login(username: string, password: string)` function
- [ ] 55. POST to `/api/auth/login`, return { userId, username }
- [ ] 56. Add `logout()` function to clear localStorage
- [ ] 57. Add `getCurrentUser()` function to get user from localStorage
- [ ] 58. Add `isAuthenticated()` function to check if user exists in localStorage

#### Auth Context
- [ ] 59. Create `web-client/src/contexts/AuthContext.tsx`
- [ ] 60. Create AuthContext with user state (userId, username)
- [ ] 61. Add login, logout, register functions
- [ ] 62. Load user from localStorage on mount
- [ ] 63. Save user to localStorage on login/register
- [ ] 64. Clear localStorage on logout
- [ ] 65. Export AuthProvider and useAuth hook

#### Login Page
- [ ] 66. Create `web-client/src/pages/LoginPage.tsx`
- [ ] 67. Add form with username and password fields
- [ ] 68. Add "Login" button
- [ ] 69. Add "Don't have an account? Register" link
- [ ] 70. Call auth.login() on form submit
- [ ] 71. Navigate to gallery on successful login
- [ ] 72. Show error message for invalid credentials
- [ ] 73. Style with Tailwind CSS (clean, centered form)

#### Register Page
- [ ] 74. Create `web-client/src/pages/RegisterPage.tsx`
- [ ] 75. Add form with username and password fields
- [ ] 76. Add "Register" button
- [ ] 77. Add "Already have an account? Login" link
- [ ] 78. Call auth.register() on form submit
- [ ] 79. Navigate to gallery on successful registration
- [ ] 80. Show error message for duplicate username
- [ ] 81. Style with Tailwind CSS (clean, centered form)

#### Protected Routes
- [ ] 82. Create `web-client/src/components/ProtectedRoute.tsx`
- [ ] 83. Use useAuth hook to check authentication
- [ ] 84. If not authenticated, redirect to /login
- [ ] 85. If authenticated, render children
- [ ] 86. Navigate to `web-client/src/App.tsx`
- [ ] 87. Wrap AuthProvider around entire app
- [ ] 88. Add route for /login (LoginPage)
- [ ] 89. Add route for /register (RegisterPage)
- [ ] 90. Wrap /upload and /gallery routes with ProtectedRoute
- [ ] 91. Set default route to /login if not authenticated

#### Navigation Updates
- [ ] 92. Navigate to `web-client/src/components/Navigation.tsx`
- [ ] 93. Add useAuth hook
- [ ] 94. Show username in navigation when logged in
- [ ] 95. Add Logout button
- [ ] 96. Call auth.logout() and navigate to /login on logout

#### API Service Updates
- [ ] 97. Navigate to `web-client/src/services/api.ts`
- [ ] 98. Update API client to get userId from auth context (via getCurrentUser)
- [ ] 99. Update all API calls to use authenticated userId instead of hardcoded
- [ ] 100. Update `initiateBatchUpload` to use auth userId
- [ ] 101. Update `completePhotoUpload` to use auth userId
- [ ] 102. Update `getUserPhotos` to use auth userId
- [ ] 103. Update `getPhotoById` to use auth userId

---

### Mobile Client - Auth UI & State

#### Auth Service
- [ ] 104. Create `mobile-client/services/auth.ts`
- [ ] 105. Add `register(username: string, password: string)` function
- [ ] 106. POST to `/api/auth/register`, return { userId, username }
- [ ] 107. Add `login(username: string, password: string)` function
- [ ] 108. POST to `/api/auth/login`, return { userId, username }
- [ ] 109. Add `logout()` function to clear AsyncStorage
- [ ] 110. Add `getCurrentUser()` function to get user from AsyncStorage
- [ ] 111. Add `isAuthenticated()` function to check if user exists

#### Auth Context
- [ ] 112. Create `mobile-client/contexts/AuthContext.tsx`
- [ ] 113. Create AuthContext with user state (userId, username)
- [ ] 114. Add login, logout, register functions
- [ ] 115. Load user from AsyncStorage on mount
- [ ] 116. Save user to AsyncStorage on login/register
- [ ] 117. Clear AsyncStorage on logout
- [ ] 118. Export AuthProvider and useAuth hook

#### Login Screen
- [ ] 119. Create `mobile-client/app/auth/login.tsx`
- [ ] 120. Add form with username and password TextInputs
- [ ] 121. Add "Login" button
- [ ] 122. Add "Don't have an account? Register" link
- [ ] 123. Call auth.login() on button press
- [ ] 124. Navigate to tabs on successful login
- [ ] 125. Show error alert for invalid credentials
- [ ] 126. Style with React Native components

#### Register Screen
- [ ] 127. Create `mobile-client/app/auth/register.tsx`
- [ ] 128. Add form with username and password TextInputs
- [ ] 129. Add "Register" button
- [ ] 130. Add "Already have an account? Login" link
- [ ] 131. Call auth.register() on button press
- [ ] 132. Navigate to tabs on successful registration
- [ ] 133. Show error alert for duplicate username
- [ ] 134. Style with React Native components

#### Protected Navigation
- [ ] 135. Navigate to `mobile-client/app/_layout.tsx`
- [ ] 136. Wrap AuthProvider around entire app
- [ ] 137. Add auth check in root layout
- [ ] 138. If not authenticated, redirect to /auth/login
- [ ] 139. If authenticated, allow access to tabs

#### Tab Layout Updates
- [ ] 140. Navigate to `mobile-client/app/tabs/_layout.tsx`
- [ ] 141. Add useAuth hook
- [ ] 142. Add logout button in header (if possible) or as tab
- [ ] 143. Call auth.logout() and navigate to /auth/login on logout

#### API Service Updates
- [ ] 144. Navigate to `mobile-client/services/api.ts`
- [ ] 145. Update API client to get userId from auth context
- [ ] 146. Update all API calls to use authenticated userId instead of hardcoded
- [ ] 147. Update `initiateBatchUpload` to use auth userId
- [ ] 148. Update `completePhotoUpload` to use auth userId
- [ ] 149. Update `getUserPhotos` to use auth userId
- [ ] 150. Update `getPhotoById` to use auth userId

---

## PR #27: Photo Authorization (Delete with User Check)

### Backend - Update Delete Endpoint
- [ ] 1. Navigate to `DeletePhotoController.java`
- [ ] 2. Update DELETE endpoint to accept userId query param: `@RequestParam String userId`
- [ ] 3. Convert userId to UserId object
- [ ] 4. Update DeletePhotoCommand to include userId
- [ ] 5. Update DeletePhotoCommandHandler to use `findByIdAndUserId` instead of `findById`
- [ ] 6. If photo not found or doesn't belong to user, throw PhotoNotFoundException
- [ ] 7. Add logging for authorization checks
- [ ] 8. Update exception handling to distinguish not found vs unauthorized

### Web Client - Update Delete API Call
- [ ] 9. Navigate to `web-client/src/services/api.ts`
- [ ] 10. Update `deletePhoto` to accept and pass userId
- [ ] 11. Get userId from getCurrentUser() helper
- [ ] 12. Update DELETE request to include userId query param

### Mobile Client - Update Delete API Call
- [ ] 13. Navigate to `mobile-client/services/api.ts`
- [ ] 14. Update `deletePhoto` to accept and pass userId
- [ ] 15. Get userId from getCurrentUser() helper
- [ ] 16. Update DELETE request to include userId query param

---

## Testing & Verification

### Delete Functionality Testing
- [ ] 1. Test deleting photo from web gallery (should remove from UI immediately)
- [ ] 2. Verify photo deleted from database
- [ ] 3. Verify photo deleted from S3
- [ ] 4. Test deleting photo that's already deleted from S3 (should succeed)
- [ ] 5. Test deleting non-existent photo (should return 404)
- [ ] 6. Test mobile long-press delete (should show confirmation)
- [ ] 7. Test mobile delete confirmation cancel (should not delete)
- [ ] 8. Test mobile delete confirmation accept (should delete)

### Auth Testing
- [ ] 9. Test user registration with new username (should succeed)
- [ ] 10. Test registration with duplicate username (should fail with 409)
- [ ] 11. Test login with valid credentials (should succeed)
- [ ] 12. Test login with invalid password (should fail with 401)
- [ ] 13. Test login with non-existent username (should fail with 401)
- [ ] 14. Verify userId and username stored in localStorage/AsyncStorage
- [ ] 15. Test logout (should clear storage and redirect to login)
- [ ] 16. Test protected route access without auth (should redirect to login)
- [ ] 17. Test protected route access with auth (should allow access)
- [ ] 18. Verify photos are scoped to logged-in user
- [ ] 19. Test uploading photos as authenticated user
- [ ] 20. Verify uploaded photos only visible to that user

### Authorization Testing
- [ ] 21. Test deleting own photo (should succeed)
- [ ] 22. Test attempting to delete another user's photo (should fail with 404/401)
- [ ] 23. Verify gallery only shows authenticated user's photos
- [ ] 24. Test uploading as user A, logging out, logging in as user B (should not see user A's photos)

---

## Summary

**PR #25: Photo Delete Functionality**
- Backend: S3 delete, delete command/handler/controller
- Web: Delete button, confirmation modal, optimistic UI updates
- Mobile: Long-press delete, alert confirmation, optimistic UI updates
- **Estimated Time**: 45 minutes - 1 hour

**PR #26: Mocked User Authentication**
- Backend: User entity, auth endpoints (register/login)
- Web: Login/register pages, auth context, protected routes
- Mobile: Login/register screens, auth context, protected navigation
- API updates to use authenticated userId
- **Estimated Time**: 1.5 - 2 hours

**PR #27: Photo Authorization**
- Update delete endpoint to verify photo ownership
- Update API calls to pass userId
- **Estimated Time**: 15-20 minutes

**Total Estimated Time**: 2.5 - 3.5 hours

