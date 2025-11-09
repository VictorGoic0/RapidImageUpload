/**
 * Raw WebSocket client for batch upload progress tracking.
 * 
 * Connects to /ws/upload-progress/{batchId} endpoint and receives JSON progress updates.
 * No STOMP protocol - simple WebSocket communication.
 */

export interface ProgressCallback {
  (message: any): void;
}

export interface WebSocketClientConfig {
  batchId: string;
  baseUrl: string; // e.g., 'ws://localhost:8080' or 'wss://your-app.us-east-1.elasticbeanstalk.com'
  onOpen?: () => void;
  onMessage: ProgressCallback;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export class UploadProgressWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(config: WebSocketClientConfig) {
    this.config = config;
  }

  /**
   * Connects to the WebSocket endpoint for batch progress tracking
   */
  connect(): void {
    const url = `${this.config.baseUrl}/ws/upload-progress/${this.config.batchId}`;
    
    if (__DEV__) {
      console.log('[WebSocket] Connecting to:', url);
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (__DEV__) {
          console.log('[WebSocket] Connected to batch:', this.config.batchId);
        }
        this.reconnectAttempts = 0; // Reset on successful connection
        this.config.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (__DEV__) {
            console.log('[WebSocket] Message received:', message);
          }
          this.config.onMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', event.data, error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.config.onError?.(error);
      };

      this.ws.onclose = (event) => {
        if (__DEV__) {
          console.log('[WebSocket] Closed:', event.code, event.reason);
        }
        
        this.config.onClose?.(event);

        // Auto-reconnect if not manually closed and within retry limit
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          if (__DEV__) {
            console.log(`[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          }
          this.reconnectTimeoutId = setTimeout(() => {
            this.connect();
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.config.onError?.(error as Event);
    }
  }

  /**
   * Disconnects from the WebSocket
   */
  disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      if (__DEV__) {
        console.log('[WebSocket] Disconnecting from batch:', this.config.batchId);
      }
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Checks if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

