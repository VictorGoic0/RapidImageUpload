import { Client } from '@stomp/stompjs';
import { Platform } from 'react-native';
import 'text-encoding';

// Conditional import for SockJS (only needed on web platform)
let SockJS: any = null;
if (Platform.OS === 'web') {
  try {
    SockJS = require('sockjs-client');
  } catch (e) {
    console.warn('[WebSocket] SockJS not available, falling back to native WebSocket');
  }
}

/**
 * Creates and configures a STOMP WebSocket client for real-time communication.
 * 
 * Platform-specific behavior:
 * - Web platform: Uses SockJS (requires http:// URL with /ws-sockjs endpoint)
 * - Native platforms (iOS/Android): Uses native WebSocket (requires ws:// URL with /ws endpoint)
 * 
 * "Native WebSocket" refers to the browser/React Native built-in WebSocket API,
 * available globally without additional libraries.
 *
 * @param url - The WebSocket server URL (full URL from environment variable)
 *   - Web: 'http://localhost:8080/ws-sockjs' (from EXPO_PUBLIC_WS_URL_WEB)
 *   - Native: 'ws://localhost:8080/ws' (from EXPO_PUBLIC_WS_URL_NATIVE)
 * @returns Configured STOMP Client instance
 */
export function createWebSocketClient(url: string): Client {
  const isWeb = Platform.OS === 'web';
  const useSockJS = isWeb && SockJS !== null;

  if (__DEV__) {
    console.log('[WebSocket] Platform:', Platform.OS);
    console.log('[WebSocket] Using:', useSockJS ? 'SockJS' : 'Native WebSocket');
    console.log('[WebSocket] Connecting to:', url);
  }

  const client = new Client({
    // Platform-specific WebSocket factory
    webSocketFactory: () => {
      if (useSockJS) {
        // Web platform: Use SockJS
        return new SockJS(url) as unknown as WebSocket;
      } else {
        // Native platforms (iOS/Android): Use native WebSocket
        return new WebSocket(url);
      }
    },
    // Enable debug logging in development
    debug: (str) => {
      if (__DEV__) {
        console.log('[STOMP]', str);
      }
    },
    // Configure automatic reconnection with 5 second delay
    reconnectDelay: 5000,
    // Heartbeat configuration (matching backend: 10 seconds)
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 10000,
  });

  return client;
}

