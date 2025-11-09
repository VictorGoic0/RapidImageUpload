package com.rapidphoto.infrastructure.websocket;

import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Raw WebSocket endpoint for testing connectivity.
 * This bypasses Spring's STOMP layer to test if basic WebSocket works through EBS.
 * 
 * Test with: wscat -c wss://your-domain.com/ws/test
 * Or from browser: new WebSocket("wss://your-domain.com/ws/test")
 */
@Component
@ServerEndpoint("/ws/test")
public class TestWebSocketEndpoint {
    
    private static final Logger log = LoggerFactory.getLogger(TestWebSocketEndpoint.class);

    @OnOpen
    public void onOpen(Session session) {
        log.info("✅ Raw WebSocket OPENED - Session: {}", session.getId());
        try {
            session.getBasicRemote().sendText("CONNECTED: Test endpoint ready");
        } catch (Exception e) {
            log.error("Error sending welcome message", e);
        }
    }

    @OnMessage
    public void onMessage(Session session, String message) {
        log.info("📨 Raw WebSocket MESSAGE - Session: {}, Message: {}", session.getId(), message);
        try {
            session.getBasicRemote().sendText("ECHO: " + message);
        } catch (Exception e) {
            log.error("Error sending echo", e);
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        log.info("🔌 Raw WebSocket CLOSED - Session: {}, Reason: {}", session.getId(), reason);
    }

    @OnError
    public void onError(Session session, Throwable t) {
        log.error("❌ Raw WebSocket ERROR - Session: {}", session.getId(), t);
    }
}

