import { Client } from '@stomp/stompjs';
import 'text-encoding';

/**
 * Creates and configures a STOMP WebSocket client for real-time communication.
 * Uses native WebSocket for React Native (no SockJS needed).
 *
 * @param url - The WebSocket server URL (e.g., 'ws://localhost:8080/ws')
 * @returns Configured STOMP Client instance
 */
export function createWebSocketClient(url: string): Client {
  const brokerURL = process.env.EXPO_PUBLIC_WS_URL || url;

  const client = new Client({
    // Use native WebSocket factory for React Native
    webSocketFactory: () => {
      return new WebSocket(brokerURL);
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

