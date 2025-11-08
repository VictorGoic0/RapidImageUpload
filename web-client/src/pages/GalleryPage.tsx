import { usePhotoGallery } from '@/hooks/usePhotoGallery';
import { PhotoCard } from '@/components/PhotoCard';
import { RefreshCw, ImageOff, Loader2 } from 'lucide-react';

/**
 * Mock userId constant for MVP (hardcoded UUID).
 * In production, this would come from authentication context.
 * Should match the userId used in UploadPage.
 */
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Gallery page component that displays user's photos in a grid layout with pagination.
 */
export function GalleryPage() {
  const { photos, loading, error, currentPage, totalPages, loadMore, refetch } =
    usePhotoGallery(MOCK_USER_ID);

  const handleRefresh = () => {
    refetch();
  };

  const hasMorePages = currentPage < totalPages - 1;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
            My Photos
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading spinner - show when loading and no photos */}
        {loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading photos...</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold text-lg">Error</p>
            <p className="text-red-600 dark:text-red-300 text-base mt-2">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && photos.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageOff className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Upload your first photo to get started. Your photos will appear here once uploaded.
            </p>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {photos.map((photo) => (
                <PhotoCard key={photo.photoId} photo={photo} />
              ))}
            </div>

            {/* Load More button */}
            {hasMorePages && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More</span>
                  )}
                </button>
              </div>
            )}

            {/* End of results message */}
            {!hasMorePages && photos.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  You've reached the end of your photos.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

