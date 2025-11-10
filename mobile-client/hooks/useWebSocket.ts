import { useState, useEffect, useRef } from 'react';
import { UploadProgressWebSocketClient } from '../services/websocket';

export interface BatchProgress {
  batchId: string;
  photoId: string;
  fileName: string;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  progressPercentage: number;
  totalPhotos?: number;
  completedPhotos?: number;
  message: string;
  timestamp: string;
}

/**
 * Hook for managing raw WebSocket connection for batch upload progress tracking.
 * 
 * Connects to /ws/upload-progress/{batchId} endpoint and receives JSON progress updates.
 * No STOMP protocol - simple WebSocket communication.
 *
 * @param batchId - The batch ID to monitor (from batch upload response)
 * @param baseUrl - WebSocket base URL (e.g., 'ws://localhost:8080' or 'wss://your-app.com')
 * @returns Object containing connection status and progress map
 */
export function useWebSocket(batchId: string | null, baseUrl: string) {
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<Map<string, BatchProgress>>(new Map());
  const clientRef = useRef<UploadProgressWebSocketClient | null>(null);

  useEffect(() => {
    // Only connect if we have a batch ID
    if (!batchId) {
      if (__DEV__) {
        console.log('[useWebSocket] No batchId provided, skipping connection');
      }
      return;
    }

    if (__DEV__) {
      console.log('[useWebSocket] Initializing connection for batch:', batchId);
      console.log('[useWebSocket] Base URL:', baseUrl);
    }

    // Create WebSocket client
    const client = new UploadProgressWebSocketClient({
      batchId,
      baseUrl,
      onOpen: () => {
        setConnected(true);
        if (__DEV__) {
          console.log('[useWebSocket] Connected to batch:', batchId);
        }
      },
      onMessage: (message: BatchProgress) => {
        // Handle different message types
        // Backend sends { type: "connected", batchId, message } on initial connection
        if ('type' in message && (message as any).type === 'connected') {
          // Initial connection confirmation
          if (__DEV__) {
            console.log('[useWebSocket] Connection confirmed:', (message as any).message);
          }
          return;
        }

        // Skip if this is not a valid progress message (missing photoId)
        if (!message.photoId) {
          if (__DEV__) {
            console.log('[useWebSocket] Skipping non-progress message:', message);
          }
          return;
        }

        // Update progress map with new progress update (use photoId as key)
        setProgress((prev) => {
          const updated = new Map(prev);
          updated.set(message.photoId, message);
          return updated;
        });

        if (__DEV__) {
          console.log('[useWebSocket] Progress update:', {
            photoId: message.photoId,
            fileName: message.fileName,
            status: message.status,
            progress: message.progressPercentage,
          });
        }
      },
      onError: (error) => {
        console.error('[useWebSocket] WebSocket error:', error);
      },
      onClose: (event) => {
        setConnected(false);
        if (__DEV__) {
          console.log('[useWebSocket] Connection closed:', event.code, event.reason);
        }
      },
    });

    // Connect
    client.connect();

    // Store client reference for cleanup
    clientRef.current = client;

    // Cleanup function: disconnect on unmount or batchId change
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [batchId, baseUrl]);

  return {
    connected,
    progress,
  };
}

