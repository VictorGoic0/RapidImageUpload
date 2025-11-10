import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { UploadPage } from '@/pages/UploadPage';
import { GalleryPage } from '@/pages/GalleryPage';
import './App.css';

/**
 * Main App component with routing configuration.
 * WebSocket connections are now managed per-upload in UploadPage.
 * Authentication is handled via AuthProvider and ProtectedRoute.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes with navigation */}
          <Route
            path="/*"
            element={
              <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-[1400px] mx-auto">
                  <Navigation />
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Navigate to="/gallery" replace />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        <ProtectedRoute>
                          <UploadPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/gallery"
                      element={
                        <ProtectedRoute>
                          <GalleryPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Default redirect to login if route not found */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
