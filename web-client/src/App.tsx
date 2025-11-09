import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { UploadPage } from '@/pages/UploadPage';
import { GalleryPage } from '@/pages/GalleryPage';
import './App.css';

/**
 * Main App component with routing configuration.
 * WebSocket connections are now managed per-upload in UploadPage.
 */
function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1400px] mx-auto">
          <Navigation />
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
