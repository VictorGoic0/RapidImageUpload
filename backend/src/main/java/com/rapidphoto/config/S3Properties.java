package com.rapidphoto.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for AWS S3 integration.
 * Binds to the 'aws.s3' prefix in application.yml
 */
@ConfigurationProperties(prefix = "aws.s3")
public record S3Properties(
    String bucket,
    String region
) {
}

