package com.rapidphoto.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Configuration class for AWS S3 integration.
 * Creates and configures the S3Client bean using properties from application.yml
 */
@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Config {

    private static final Logger log = LoggerFactory.getLogger(S3Config.class);

    private final S3Properties s3Properties;

    public S3Config(S3Properties s3Properties) {
        this.s3Properties = s3Properties;
    }

    /**
     * Creates and configures the S3Client bean.
     * Uses default credentials provider chain (environment variables, system properties, 
     * AWS credentials file, IAM roles, etc.)
     * 
     * @return configured S3Client instance
     */
    @Bean
    public S3Client s3Client() {
        log.info("Configuring S3Client for bucket: {} in region: {}", 
                 s3Properties.bucket(), s3Properties.region());
        
        return S3Client.builder()
                .region(Region.of(s3Properties.region()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}

