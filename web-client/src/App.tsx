import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Navigation } from '@/components/Navigation';
import { UploadPage } from '@/pages/UploadPage';
import { GalleryPage } from '@/pages/GalleryPage';
import './App.css';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Main App component with routing configuration.
 * WebSocket connection is initialized here to persist across navigation.
 */
function App() {
  // Initialize WebSocket connection at app level (persists across navigation)
  const { connected, progress, sendProgress } = useWebSocket(MOCK_USER_ID);

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen">
        <Navigation />
        <Routes>
          <Route
            path="/"
            element={
              <UploadPage
                websocketConnected={connected}
                websocketProgress={progress}
                websocketSendProgress={sendProgress}
              />
            }
          />
          <Route
            path="/upload"
            element={
              <UploadPage
                websocketConnected={connected}
                websocketProgress={progress}
                websocketSendProgress={sendProgress}
              />
            }
          />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
