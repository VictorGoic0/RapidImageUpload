package com.rapidphoto.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time photo upload progress updates.
 * Uses STOMP protocol over WebSocket with SockJS fallback support.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);
    private final TaskScheduler taskScheduler;

    /**
     * Constructor injection of TaskScheduler.
     * The TaskScheduler bean is provided by AsyncConfig.
     */
    @Autowired
    public WebSocketConfig(TaskScheduler taskScheduler) {
        this.taskScheduler = taskScheduler;
    }

    /**
     * Configures the message broker for WebSocket communication.
     * - Simple broker enabled for "/topic" and "/queue" destinations
     * - Application destination prefix: "/app" (for client-to-server messages)
     * - User destination prefix: "/user" (for user-specific messages)
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topic and queue destinations with heartbeat
        // Heartbeat: send every 10 seconds, expect response within 20 seconds
        var brokerRegistration = config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000}); // [sendInterval, receiveTimeout] in milliseconds
        
        // Set TaskScheduler for heartbeat functionality
        brokerRegistration.setTaskScheduler(taskScheduler);
        
        // Set prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        
        // Set prefix for user-specific destinations
        config.setUserDestinationPrefix("/user");
        
        log.info("WebSocket message broker configured: topics=/topic, queues=/queue, app prefix=/app, user prefix=/user, heartbeat=10s");
    }

    /**
     * Registers STOMP endpoints for WebSocket connections.
     * - Endpoint: "/ws" - Native WebSocket endpoint (for mobile clients)
     * - Endpoint: "/ws-sockjs" - SockJS endpoint (for web browsers)
     * - Allowed origins: Uses centralized CORS configuration from CorsConfig.ALLOWED_ORIGINS
     * 
     * Note: Both endpoints support the same STOMP protocol, allowing clients to choose
     * based on their platform capabilities.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Use centralized CORS origins from CorsConfig for web endpoints
        String[] allowedOrigins = CorsConfig.ALLOWED_ORIGINS.toArray(new String[0]);
        
        // Native WebSocket endpoint for mobile clients (iOS, Android, React Native)
        // Mobile apps don't send Origin headers, so we allow any origin
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        
        // SockJS endpoint for web browsers (with fallback support)
        // Web browsers send Origin headers, so we use strict origin checking
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
        
        log.info("STOMP endpoints registered: /ws (native WebSocket - any origin), /ws-sockjs (SockJS - {} origins)", 
                 CorsConfig.ALLOWED_ORIGINS.size());
    }
}

