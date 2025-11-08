import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Creates and configures a STOMP WebSocket client for real-time communication.
 * Uses SockJS as a fallback for browsers that don't support native WebSocket.
 *
 * @param url - The WebSocket server URL (e.g., 'http://localhost:8080/ws')
 * @returns Configured STOMP Client instance
 */
export function createWebSocketClient(url: string): Client {
  const brokerURL = import.meta.env.VITE_WS_URL || url;

  const client = new Client({
    // Use SockJS as the WebSocket factory for better browser compatibility
    webSocketFactory: () => {
      return new SockJS(brokerURL) as unknown as WebSocket;
    },
    // Enable debug logging in development
    debug: (str) => {
      if (import.meta.env.DEV) {
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

