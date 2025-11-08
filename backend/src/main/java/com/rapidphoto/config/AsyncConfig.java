package com.rapidphoto.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Configuration for asynchronous processing using Java 21 Virtual Threads.
 * Falls back to traditional thread pool executor for older Java versions.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);
    private static final int JAVA_VERSION = getJavaVersion();

    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        if (JAVA_VERSION >= 21) {
            log.info("Using Java 21+ Virtual Threads for async execution");
            return Executors.newVirtualThreadPerTaskExecutor();
        } else {
            log.warn("Java version {} detected. Virtual threads require Java 21+. Using ThreadPoolTaskExecutor fallback.", JAVA_VERSION);
            ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
            executor.setCorePoolSize(10);
            executor.setMaxPoolSize(50);
            executor.setQueueCapacity(1000);
            executor.setThreadNamePrefix("async-");
            executor.setWaitForTasksToCompleteOnShutdown(true);
            executor.setAwaitTerminationSeconds(60);
            executor.initialize();
            return executor;
        }
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new CustomAsyncExceptionHandler();
    }

    /**
     * Custom exception handler for async methods.
     * Logs uncaught exceptions from @Async methods.
     */
    private static class CustomAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

        private static final Logger log = LoggerFactory.getLogger(CustomAsyncExceptionHandler.class);

        @Override
        public void handleUncaughtException(Throwable ex, Method method, Object... params) {
            log.error("Uncaught exception in async method: {}.{}() with parameters: {}", 
                     method.getDeclaringClass().getName(), 
                     method.getName(), 
                     params, 
                     ex);
        }
    }

    /**
     * Gets the Java version number.
     * @return Java version (e.g., 21 for Java 21)
     */
    private static int getJavaVersion() {
        String version = System.getProperty("java.version");
        if (version.startsWith("1.")) {
            version = version.substring(2, 3);
        } else {
            int dot = version.indexOf(".");
            if (dot != -1) {
                version = version.substring(0, dot);
            }
        }
        try {
            return Integer.parseInt(version);
        } catch (NumberFormatException e) {
            log.warn("Could not parse Java version: {}. Defaulting to version check.", version);
            return 0;
        }
    }
}

