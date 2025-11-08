package com.rapidphoto.features.batchupload;

import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.infrastructure.s3.S3Service;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Command handler for batch photo upload operations.
 * Handles the creation of photos and generation of presigned upload URLs.
 */
@Service
public class BatchUploadCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(BatchUploadCommandHandler.class);
    private static final Duration UPLOAD_URL_EXPIRATION = Duration.ofMinutes(15);

    private final PhotoRepository photoRepository;
    private final S3Service s3Service;

    public BatchUploadCommandHandler(PhotoRepository photoRepository, S3Service s3Service) {
        this.photoRepository = photoRepository;
        this.s3Service = s3Service;
    }

    @Transactional
    public BatchUploadResponse handle(InitiateBatchUploadCommand command) {
        long startTime = System.currentTimeMillis();
        int photoCount = command.photos().size();
        
        log.info("Starting batch upload for userId: {}, photoCount: {}", 
                 command.userId().value(), photoCount);

        try {
            // Create Photo entities
            List<Photo> photos = new ArrayList<>();
            for (PhotoMetadata metadata : command.photos()) {
                Photo photo = Photo.createPending(
                    command.userId(),
                    metadata.fileName(),
                    metadata.size(),
                    metadata.contentType()
                );
                photos.add(photo);
            }

            // Save all photos to database
            log.debug("Saving {} photos to database", photos.size());
            List<Photo> savedPhotos = photoRepository.saveAll(photos);
            log.info("Successfully saved {} photos to database", savedPhotos.size());

            // Generate S3 keys and presigned URLs
            List<PresignedUploadInfo> uploadInfos = new ArrayList<>();
            Instant expirationTime = Instant.now().plus(UPLOAD_URL_EXPIRATION);

            for (int i = 0; i < savedPhotos.size(); i++) {
                Photo photo = savedPhotos.get(i);
                PhotoMetadata metadata = command.photos().get(i);

                try {
                    String s3Key = s3Service.generateS3Key(command.userId(), metadata.fileName());
                    String presignedUrl = s3Service.generatePresignedUploadUrl(s3Key, metadata.contentType());

                    PresignedUploadInfo uploadInfo = new PresignedUploadInfo(
                        photo.getId().value().toString(),
                        metadata.fileName(),
                        presignedUrl,
                        s3Key,
                        expirationTime
                    );
                    uploadInfos.add(uploadInfo);

                    log.debug("Generated presigned URL for photo: {}, s3Key: {}", 
                             photo.getId().value(), s3Key);
                } catch (S3UploadException e) {
                    log.error("Failed to generate presigned URL for photo: {}", 
                             photo.getId().value(), e);
                    throw new S3UploadException(
                        "Failed to generate presigned URL for photo: " + photo.getId().value(), e);
                }
            }

            // Create response
            BatchUploadResponse response = new BatchUploadResponse(
                uploadInfos,
                uploadInfos.size(),
                Instant.now()
            );

            long duration = System.currentTimeMillis() - startTime;
            log.info("Batch upload completed successfully for userId: {}, photoCount: {}, duration: {}ms", 
                     command.userId().value(), photoCount, duration);

            return response;

        } catch (S3UploadException e) {
            log.error("S3 service error during batch upload for userId: {}", 
                     command.userId().value(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during batch upload for userId: {}", 
                     command.userId().value(), e);
            throw new RuntimeException("Failed to process batch upload: " + e.getMessage(), e);
        }
    }
}

