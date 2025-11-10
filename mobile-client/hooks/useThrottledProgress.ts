import { useRef, useCallback } from 'react';
import type { PhotoProgress } from '../types/photo';

/**
 * Hook that throttles progress updates to prevent overwhelming the server.
 * Sends updates at most once per throttleMs, or immediately when progress reaches 100%.
 *
 * @param sendProgress - Function to send progress updates (from useWebSocket hook)
 * @param throttleMs - Minimum milliseconds between progress updates (default: 300)
 * @returns Throttled function to send progress updates
 */
export function useThrottledProgress(
  sendProgress: (progress: PhotoProgress) => void,
  throttleMs: number = 300
) {
  // Map to track last update time for each photo
  const lastUpdateRef = useRef<Map<string, number>>(new Map());

  /**
   * Throttled function to send progress updates.
   * Only sends if enough time has passed since last update, or if progress is 100%.
   *
   * @param photoId - The photo ID
   * @param progressPercent - Progress percentage (0-100)
   * @param additionalData - Additional PhotoProgress data (fileName, status, message, timestamp)
   */
  const throttledSend = useCallback(
    (
      photoId: string,
      progressPercent: number,
      additionalData: {
        fileName: string;
        status: PhotoProgress['status'];
        message: string;
        timestamp: string;
      }
    ) => {
      const now = Date.now();
      const lastUpdate = lastUpdateRef.current.get(photoId) || 0;
      const timeSinceLastUpdate = now - lastUpdate;

      // Send update if:
      // 1. Enough time has passed since last update, OR
      // 2. Progress is 100% (always send completion)
      const shouldSend = timeSinceLastUpdate >= throttleMs || progressPercent >= 100;

      if (shouldSend) {
        const progressData: PhotoProgress = {
          photoId,
          fileName: additionalData.fileName,
          status: additionalData.status,
          progressPercentage: progressPercent,
          message: additionalData.message,
          timestamp: additionalData.timestamp,
        };

        sendProgress(progressData);
        lastUpdateRef.current.set(photoId, now);
      }
    },
    [sendProgress, throttleMs]
  );

  return throttledSend;
}

