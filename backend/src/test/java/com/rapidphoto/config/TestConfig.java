package com.rapidphoto.config;

import com.rapidphoto.infrastructure.s3.S3Service;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Test configuration for integration tests.
 * Provides mock beans for external dependencies like S3Service.
 */
@TestConfiguration
public class TestConfig {

    /**
     * Creates a mock S3Service bean for testing.
     * Tests can configure the mock behavior as needed.
     */
    @Bean
    @Primary
    public S3Service mockS3Service() {
        return Mockito.mock(S3Service.class);
    }
}

