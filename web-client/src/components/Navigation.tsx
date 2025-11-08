import { Link, useLocation } from 'react-router-dom';
import { Upload, Image } from 'lucide-react';

/**
 * Navigation component for the application.
 * Provides navigation links between Upload and Gallery pages.
 */
export function Navigation() {
  const location = useLocation();

  // Check if a route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-12">
        <div className="flex items-center justify-between h-20">
          {/* App logo/title */}
          <Link
            to="/"
            className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Image className="w-8 h-8" />
            <span>RapidPhoto</span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-colors
                ${
                  isActive('/upload') || isActive('/')
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </Link>
            <Link
              to="/gallery"
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-colors
                ${
                  isActive('/gallery')
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Image className="w-5 h-5" />
              <span>Gallery</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

