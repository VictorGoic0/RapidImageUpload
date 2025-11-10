package com.rapidphoto.infrastructure.s3;

import com.rapidphoto.config.S3Properties;
import com.rapidphoto.domain.UserId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service for AWS S3 operations including presigned URL generation,
 * key management, and object verification.
 */
@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);
    private static final Duration UPLOAD_URL_EXPIRATION = Duration.ofMinutes(15);
    private static final Duration DOWNLOAD_URL_EXPIRATION = Duration.ofMinutes(60);
    private static final Pattern INVALID_CHARS = Pattern.compile("[^a-zA-Z0-9._-]");

    private final S3Client s3Client;
    private final S3Properties s3Properties;
    private final S3Presigner s3Presigner;

    public S3Service(S3Client s3Client, S3Properties s3Properties) {
        this.s3Client = s3Client;
        this.s3Properties = s3Properties;
        this.s3Presigner = S3Presigner.builder()
                .region(Region.of(s3Properties.region()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * Generates a presigned URL for uploading a file to S3.
     * 
     * @param key The S3 key where the file will be stored
     * @param contentType The content type of the file (e.g., "image/jpeg")
     * @return The presigned URL as a String
     * @throws S3UploadException if URL generation fails
     */
    public String generatePresignedUploadUrl(String key, String contentType) {
        try {
            log.debug("Generating presigned upload URL for key: {}, contentType: {}", key, contentType);

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(key)
                    .contentType(contentType)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(builder -> builder
                    .signatureDuration(UPLOAD_URL_EXPIRATION)
                    .putObjectRequest(putObjectRequest));

            String presignedUrl = presignedRequest.url().toString();
            log.info("Generated presigned upload URL for key: {}, expires in: {} minutes", 
                     key, UPLOAD_URL_EXPIRATION.toMinutes());

            return presignedUrl;
        } catch (S3Exception e) {
            log.error("Failed to generate presigned upload URL for key: {}", key, e);
            throw new S3UploadException("Failed to generate presigned upload URL: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error generating presigned upload URL for key: {}", key, e);
            throw new S3UploadException("Unexpected error generating presigned upload URL", e);
        }
    }

    /**
     * Generates a presigned URL for downloading a file from S3.
     * 
     * @param key The S3 key of the file to download
     * @return The presigned URL as a String
     * @throws S3UploadException if URL generation fails
     */
    public String generatePresignedDownloadUrl(String key) {
        try {
            log.debug("Generating presigned download URL for key: {}", key);

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(key)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(builder -> builder
                    .signatureDuration(DOWNLOAD_URL_EXPIRATION)
                    .getObjectRequest(getObjectRequest));

            String presignedUrl = presignedRequest.url().toString();
            log.info("Generated presigned download URL for key: {}, expires in: {} minutes", 
                     key, DOWNLOAD_URL_EXPIRATION.toMinutes());

            return presignedUrl;
        } catch (S3Exception e) {
            log.error("Failed to generate presigned download URL for key: {}", key, e);
            throw new S3UploadException("Failed to generate presigned download URL: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error generating presigned download URL for key: {}", key, e);
            throw new S3UploadException("Unexpected error generating presigned download URL", e);
        }
    }

    /**
     * Generates a consistent S3 key structure for a photo.
     * Format: users/{userId}/photos/{uuid}-{sanitizedFileName}
     * 
     * @param userId The user ID who owns the photo
     * @param fileName The original file name
     * @return The generated S3 key
     */
    public String generateS3Key(UserId userId, String fileName) {
        String sanitizedFileName = sanitizeFileName(fileName);
        String uniqueId = UUID.randomUUID().toString();
        String key = String.format("users/%s/photos/%s-%s", userId.value(), uniqueId, sanitizedFileName);
        
        log.debug("Generated S3 key: {} for userId: {}, fileName: {}", key, userId.value(), fileName);
        return key;
    }

    /**
     * Sanitizes a file name by removing special characters and spaces.
     * Replaces invalid characters with underscores.
     * 
     * @param fileName The original file name
     * @return The sanitized file name
     */
    public String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name cannot be null or blank");
        }

        String sanitized = INVALID_CHARS.matcher(fileName).replaceAll("_");
        
        // Remove multiple consecutive underscores
        sanitized = sanitized.replaceAll("_{2,}", "_");
        
        // Remove leading/trailing underscores
        sanitized = sanitized.replaceAll("^_+|_+$", "");
        
        // Ensure we have a valid name
        if (sanitized.isBlank()) {
            sanitized = "file_" + UUID.randomUUID().toString().substring(0, 8);
        }

        log.debug("Sanitized fileName: {} -> {}", fileName, sanitized);
        return sanitized;
    }

    /**
     * Verifies if an object exists in S3 by performing a HEAD request.
     * 
     * @param key The S3 key to check
     * @return true if the object exists, false otherwise
     * @throws S3UploadException if the check fails due to an S3 error (other than not found)
     */
    public boolean verifyObjectExists(String key) {
        try {
            log.debug("Verifying object existence for key: {}", key);

            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(key)
                    .build();

            s3Client.headObject(headRequest);
            
            log.info("Object exists in S3: {}", key);
            return true;
        } catch (NoSuchKeyException e) {
            log.debug("Object does not exist in S3: {}", key);
            return false;
        } catch (S3Exception e) {
            log.error("Failed to verify object existence for key: {}", key, e);
            throw new S3UploadException("Failed to verify object existence: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error verifying object existence for key: {}", key, e);
            throw new S3UploadException("Unexpected error verifying object existence", e);
        }
    }

    /**
     * Deletes an object from S3.
     * If the object doesn't exist (NoSuchKeyException), logs a warning but returns successfully.
     * 
     * @param key The S3 key of the object to delete
     * @throws S3UploadException if deletion fails due to an S3 error (other than not found)
     */
    public void deleteObject(String key) {
        try {
            log.debug("Deleting object from S3: key={}", key);

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(s3Properties.bucket())
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            
            log.info("Successfully deleted object from S3: key={}", key);
        } catch (NoSuchKeyException e) {
            log.warn("Object does not exist in S3 (already deleted or never existed): key={}", key);
            // Return successfully - object doesn't exist, which is the desired state
        } catch (S3Exception e) {
            log.error("Failed to delete object from S3: key={}, error={}", key, e.getMessage(), e);
            throw new S3UploadException("Failed to delete object from S3: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error deleting object from S3: key={}", key, e);
            throw new S3UploadException("Unexpected error deleting object from S3", e);
        }
    }
}

