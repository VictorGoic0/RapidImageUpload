package com.rapidphoto.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * WebSocket endpoint for real-time upload progress updates.
 * 
 * Clients connect to /ws/upload-progress/{batchId} and receive JSON progress updates.
 * Multiple clients can connect to the same batch ID to monitor progress from different devices.
 */
@Component
@ServerEndpoint("/ws/upload-progress/{batchId}")
public class UploadProgressWebSocketEndpoint {
    
    private static final Logger log = LoggerFactory.getLogger(UploadProgressWebSocketEndpoint.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    // Map of batchId -> Set of sessions monitoring that batch
    private static final Map<String, Set<Session>> batchSessions = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("batchId") String batchId) {
        log.info("WebSocket OPENED - Session: {}, BatchId: {}", session.getId(), batchId);
        
        // Store batch ID in session for later use
        session.getUserProperties().put("batchId", batchId);
        
        // Add session to the batch's session set
        batchSessions.computeIfAbsent(batchId, k -> new CopyOnWriteArraySet<>()).add(session);
        
        log.info("Active sessions for batch {}: {}", batchId, batchSessions.get(batchId).size());
        
        // Send initial connection confirmation
        try {
            Map<String, Object> message = Map.of(
                "type", "connected",
                "batchId", batchId,
                "message", "Connected to upload progress stream"
            );
            session.getBasicRemote().sendText(objectMapper.writeValueAsString(message));
        } catch (IOException e) {
            log.error("Error sending connection confirmation", e);
        }
    }

    @OnMessage
    public void onMessage(Session session, String message, @PathParam("batchId") String batchId) {
        log.debug("WebSocket MESSAGE - Session: {}, BatchId: {}, Message: {}", 
                 session.getId(), batchId, message);
        // Clients typically don't send messages, but we log them if they do
    }

    @OnClose
    public void onClose(Session session, CloseReason reason, @PathParam("batchId") String batchId) {
        log.info("WebSocket CLOSED - Session: {}, BatchId: {}, Reason: {}", 
                session.getId(), batchId, reason);
        
        // Remove session from batch's session set
        Set<Session> sessions = batchSessions.get(batchId);
        if (sessions != null) {
            sessions.remove(session);
            
            // Clean up empty batch session sets
            if (sessions.isEmpty()) {
                batchSessions.remove(batchId);
                log.info("No more sessions for batch {}, cleaned up", batchId);
            } else {
                log.info("Remaining sessions for batch {}: {}", batchId, sessions.size());
            }
        }
    }

    @OnError
    public void onError(Session session, Throwable error, @PathParam("batchId") String batchId) {
        log.error("WebSocket ERROR - Session: {}, BatchId: {}", session.getId(), batchId, error);
    }

    /**
     * Sends a progress update to all sessions monitoring the given batch.
     * 
     * @param batchId The batch ID
     * @param progressData The progress data to send (will be serialized to JSON)
     */
    public static void sendProgressUpdate(String batchId, Object progressData) {
        Set<Session> sessions = batchSessions.get(batchId);
        
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active WebSocket sessions for batch {}", batchId);
            return;
        }
        
        try {
            String json = objectMapper.writeValueAsString(progressData);
            
            // Send to all sessions monitoring this batch
            int successCount = 0;
            int failureCount = 0;
            
            for (Session session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.getBasicRemote().sendText(json);
                        successCount++;
                    } catch (IOException e) {
                        log.warn("Failed to send progress to session {}: {}", 
                                session.getId(), e.getMessage());
                        failureCount++;
                    }
                } else {
                    log.debug("Session {} is not open, removing", session.getId());
                    sessions.remove(session);
                    failureCount++;
                }
            }
            
            log.debug("Sent progress update for batch {} to {} sessions ({} succeeded, {} failed)", 
                     batchId, sessions.size(), successCount, failureCount);
            
        } catch (Exception e) {
            log.error("Error serializing progress data for batch {}", batchId, e);
        }
    }

    /**
     * Gets the number of active sessions for a batch.
     * 
     * @param batchId The batch ID
     * @return Number of active sessions
     */
    public static int getActiveSessionCount(String batchId) {
        Set<Session> sessions = batchSessions.get(batchId);
        return sessions != null ? sessions.size() : 0;
    }

    /**
     * Gets total number of monitored batches.
     * 
     * @return Number of batches being monitored
     */
    public static int getMonitoredBatchCount() {
        return batchSessions.size();
    }
}

