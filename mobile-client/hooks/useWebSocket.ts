import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import type { PhotoProgress } from '../types/photo';
import { createWebSocketClient } from '../services/websocket';

/**
 * Hook for managing WebSocket connection and receiving photo upload progress updates.
 *
 * @param userId - The user ID for subscribing to user-specific progress updates
 * @returns Object containing connection status, progress map, and sendProgress function
 */
export function useWebSocket(userId: string) {
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<Map<string, PhotoProgress>>(new Map());
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Get platform-specific WebSocket URL from environment
    const isWeb = Platform.OS === 'web';
    const wsUrl = isWeb 
      ? process.env.EXPO_PUBLIC_WS_URL_WEB 
      : process.env.EXPO_PUBLIC_WS_URL_NATIVE;
    
    if (!wsUrl) {
      const envVarName = isWeb ? 'EXPO_PUBLIC_WS_URL_WEB' : 'EXPO_PUBLIC_WS_URL_NATIVE';
      throw new Error(`${envVarName} environment variable is required but not set`);
    }

    if (__DEV__) {
      console.log('[useWebSocket] Environment check:');
      console.log('  Platform:', Platform.OS);
      console.log('  Using WebSocket URL:', wsUrl);
    }

    // Create and configure WebSocket client
    const client = createWebSocketClient(wsUrl);

    // Handle successful connection
    client.onConnect = () => {
      setConnected(true);
      console.log('[WebSocket] Connected');

      // Subscribe to user-specific progress queue
      // Backend sends progress updates to /user/queue/progress
      client.subscribe(`/user/queue/progress`, (message: IMessage) => {
        try {
          const progressUpdate: PhotoProgress = JSON.parse(message.body);
          
          // Update progress map with new progress update (use photoId as key)
          setProgress((prev) => {
            const updated = new Map(prev);
            updated.set(progressUpdate.photoId, progressUpdate);
            return updated;
          });
        } catch (error) {
          console.error('[WebSocket] Error parsing progress message:', error);
        }
      });
    };

    // Handle STOMP protocol errors
    client.onStompError = (frame) => {
      console.error('[WebSocket] STOMP error:', frame);
    };

    // Handle disconnection
    client.onDisconnect = () => {
      setConnected(false);
      console.log('[WebSocket] Disconnected');
    };

    // Handle WebSocket errors
    client.onWebSocketError = (event) => {
      console.error('[WebSocket] WebSocket error:', event);
    };

    // Activate the connection
    client.activate();

    // Store client reference for cleanup and sending messages
    clientRef.current = client;

    // Cleanup function: deactivate connection on unmount or userId change
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [userId]);

  /**
   * Sends a progress update message to the server.
   * Note: This is typically used for client-side progress reporting.
   * Server-side progress is automatically received via subscription.
   *
   * @param progressData - PhotoProgress object to send
   */
  const sendProgress = useCallback(
    (progressData: PhotoProgress) => {
      if (!clientRef.current || !clientRef.current.connected) {
        console.warn('[WebSocket] Cannot send progress: not connected');
        return;
      }

      try {
        clientRef.current.publish({
          destination: '/app/upload-progress',
          body: JSON.stringify(progressData),
        });
      } catch (error) {
        console.error('[WebSocket] Error sending progress:', error);
      }
    },
    []
  );

  return {
    connected,
    progress,
    sendProgress,
  };
}

