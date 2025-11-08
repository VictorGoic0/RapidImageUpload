import { useState, useEffect, useCallback } from 'react';
import { getUserPhotos } from '@/services/api';
import type { Photo, PhotoQueryResponse } from '@/types/photo';

/**
 * Hook for managing photo gallery with pagination support.
 *
 * @param userId - The user ID
 * @returns Object containing photos, loading state, error, pagination info, and control functions
 */
export function usePhotoGallery(userId: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /**
   * Fetches photos for the current page.
   */
  const fetchPhotos = useCallback(
    async (page: number = 0, append: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const response: PhotoQueryResponse = await getUserPhotos(userId, page, 20);
        
        if (append) {
          // Append new photos to existing array
          setPhotos((prev) => [...prev, ...response.photos]);
        } else {
          // Replace photos with new page
          setPhotos(response.photos);
        }

        // Update pagination state
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load photos';
        setError(errorMessage);
        console.error('[usePhotoGallery] Error fetching photos:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Fetches photos on mount and when userId changes.
   */
  useEffect(() => {
    fetchPhotos(0, false);
  }, [fetchPhotos]);

  /**
   * Loads more photos by fetching the next page.
   */
  const loadMore = useCallback(() => {
    if (currentPage < totalPages - 1 && !loading) {
      fetchPhotos(currentPage + 1, true);
    }
  }, [currentPage, totalPages, loading, fetchPhotos]);

  return {
    photos,
    loading,
    error,
    currentPage,
    totalPages,
    loadMore,
    refetch: () => fetchPhotos(0, false),
  };
}

