package com.rapidphoto.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * Centralized CORS configuration for all REST endpoints.
 * 
 * Allowed origins:
 * - http://localhost:5173 (Primary Vite dev server)
 * - http://localhost:5174 (Secondary Vite dev server)
 * - http://localhost:5175 (Tertiary Vite dev server)
 * - http://localhost:5176 (Quaternary Vite dev server)
 * - http://localhost:5177 (Quinary Vite dev server)
 * - http://localhost:8081 (Expo dev server)
 * 
 * Note: WebSocket CORS is configured separately in WebSocketConfig.java
 * but uses the same allowed origins from ALLOWED_ORIGINS constant.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Centralized list of allowed CORS origins for front-end applications.
     * This list is used by both REST controllers and WebSocket configuration.
     * 
     * IMPORTANT: When adding new front-end domains, update this list and
     * ensure WebSocketConfig.java also uses these origins.
     */
    public static final List<String> ALLOWED_ORIGINS = Arrays.asList(
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:8081",
        "https://rapid-photo-upload.netlify.app"
    );

    /**
     * Configures CORS for all REST endpoints globally.
     * Individual controllers can override with @CrossOrigin if needed,
     * but this provides default configuration for all endpoints.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(ALLOWED_ORIGINS.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * Alternative CORS configuration source for programmatic use.
     * Can be injected where needed for custom CORS handling.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(ALLOWED_ORIGINS);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

