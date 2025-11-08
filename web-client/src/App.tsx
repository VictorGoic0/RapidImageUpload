import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { UploadPage } from '@/pages/UploadPage';
import './App.css';

/**
 * Main App component with routing configuration.
 */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/gallery" element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-12 py-12 max-w-7xl">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">Gallery (Coming Soon)</h1>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
