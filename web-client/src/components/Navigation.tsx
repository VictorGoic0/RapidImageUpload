import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, Image, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Navigation component for the application.
 * Provides navigation links between Upload and Gallery pages.
 * Shows username and logout button when authenticated.
 */
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Check if a route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    // Navigation is handled by logout function in AuthContext
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="w-full px-12">
        <div className="flex items-center justify-between h-20">
          {/* App logo/title */}
          <Link
            to="/gallery"
            className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Image className="w-8 h-8" />
            <span>RapidPhoto</span>
          </Link>

          {/* Navigation links and user info */}
          <div className="flex items-center gap-6">
            {/* Navigation links */}
            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className={`
                  flex items-center gap-2 px-6 py-3 font-semibold text-base transition-colors relative
                  ${
                    isActive('/upload')
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }
                `}
              >
                <Upload className="w-5 h-5" />
                <span>Upload</span>
              </Link>
              <Link
                to="/gallery"
                className={`
                  flex items-center gap-2 px-6 py-3 font-semibold text-base transition-colors relative
                  ${
                    isActive('/gallery') || isActive('/')
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }
                `}
              >
                <Image className="w-5 h-5" />
                <span>Gallery</span>
              </Link>
            </div>

            {/* User info and logout */}
            {user && (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

