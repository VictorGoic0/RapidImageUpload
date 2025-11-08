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
     * - Endpoint: "/ws"
     * - Allowed origins: Uses centralized CORS configuration from CorsConfig.ALLOWED_ORIGINS
     * - SockJS fallback enabled for browsers that don't support WebSocket
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Use centralized CORS origins from CorsConfig
        String[] allowedOrigins = CorsConfig.ALLOWED_ORIGINS.toArray(new String[0]);
        
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
        
        log.info("STOMP endpoint registered at /ws with SockJS fallback support (CORS: {} origins)", 
                 CorsConfig.ALLOWED_ORIGINS.size());
    }
}

