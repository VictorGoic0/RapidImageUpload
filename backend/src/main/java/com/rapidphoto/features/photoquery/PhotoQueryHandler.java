package com.rapidphoto.features.photoquery;

import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.domain.UploadStatus;
import com.rapidphoto.infrastructure.s3.S3Service;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Query handler for photo retrieval operations.
 * Handles pagination, sorting, and download URL generation.
 */
@Service
public class PhotoQueryHandler {

    private static final Logger log = LoggerFactory.getLogger(PhotoQueryHandler.class);

    private final PhotoRepository photoRepository;
    private final S3Service s3Service;

    public PhotoQueryHandler(PhotoRepository photoRepository, S3Service s3Service) {
        this.photoRepository = photoRepository;
        this.s3Service = s3Service;
    }

    /**
     * Handles GetPhotosQuery to retrieve paginated photos for a user.
     * 
     * @param query The query containing userId, page, and size
     * @return PhotoQueryResponse with photos and pagination metadata
     */
    public PhotoQueryResponse handle(GetPhotosQuery query) {
        long startTime = System.currentTimeMillis();
        
        log.info("Processing photo query: userId={}, page={}, size={}",
                 query.userId().value(), query.page(), query.size());

        try {
            // Create Pageable with sorting by createdAt descending
            Pageable pageable = PageRequest.of(
                query.page(),
                query.size(),
                Sort.by(Sort.Direction.DESC, "createdAt")
            );

            // Query repository
            Page<Photo> photoPage = photoRepository.findByUserId(query.userId(), pageable);
            
            log.debug("Found {} photos for userId={}, page={}, size={}",
                     photoPage.getTotalElements(), query.userId().value(), query.page(), query.size());

            // Map photos to DTOs with download URLs
            List<PhotoDto> photoDtos = photoPage.getContent().stream()
                .map(photo -> {
                    String downloadUrl = null;
                    if (photo.getStatus() == UploadStatus.COMPLETED && photo.getS3Key() != null) {
                        try {
                            downloadUrl = s3Service.generatePresignedDownloadUrl(photo.getS3Key());
                            log.debug("Generated download URL for photo: {}", photo.getId().value());
                        } catch (S3UploadException e) {
                            log.warn("Failed to generate download URL for photo: {}, error: {}",
                                    photo.getId().value(), e.getMessage());
                            // Continue without download URL rather than failing the entire query
                        }
                    }
                    return PhotoDto.fromDomain(photo, downloadUrl);
                })
                .collect(Collectors.toList());

            // Create response
            PhotoQueryResponse response = new PhotoQueryResponse(
                photoDtos,
                photoPage.getNumber(),
                photoPage.getTotalPages(),
                photoPage.getTotalElements(),
                photoPage.getSize()
            );

            long duration = System.currentTimeMillis() - startTime;
            log.info("Photo query completed: userId={}, returned={}, total={}, duration={}ms",
                    query.userId().value(), photoDtos.size(), photoPage.getTotalElements(), duration);

            return response;

        } catch (Exception e) {
            log.error("Error processing photo query: userId={}, page={}, size={}",
                     query.userId().value(), query.page(), query.size(), e);
            throw new RuntimeException("Failed to retrieve photos: " + e.getMessage(), e);
        }
    }

    /**
     * Handles GetPhotoByIdQuery to retrieve a single photo by ID.
     * 
     * @param query The query containing photoId and userId
     * @return PhotoDto for the requested photo
     * @throws PhotoNotFoundException if photo is not found
     */
    public PhotoDto handleGetById(GetPhotoByIdQuery query) {
        log.info("Processing get photo by ID query: photoId={}, userId={}",
                 query.photoId().value(), query.userId().value());

        try {
            // Find photo by ID and userId
            Optional<Photo> photoOpt = photoRepository.findByIdAndUserId(
                    query.photoId(), query.userId());

            if (photoOpt.isEmpty()) {
                log.warn("Photo not found: photoId={}, userId={}",
                        query.photoId().value(), query.userId().value());
                throw new PhotoNotFoundException(
                    String.format("Photo not found for photoId=%s and userId=%s",
                            query.photoId().value(), query.userId().value()));
            }

            Photo photo = photoOpt.get();

            // Generate download URL if photo is COMPLETED
            String downloadUrl = null;
            if (photo.getStatus() == UploadStatus.COMPLETED && photo.getS3Key() != null) {
                try {
                    downloadUrl = s3Service.generatePresignedDownloadUrl(photo.getS3Key());
                    log.debug("Generated download URL for photo: {}", photo.getId().value());
                } catch (S3UploadException e) {
                    log.warn("Failed to generate download URL for photo: {}, error: {}",
                            photo.getId().value(), e.getMessage());
                    // Continue without download URL rather than failing the query
                }
            }

            PhotoDto photoDto = PhotoDto.fromDomain(photo, downloadUrl);
            
            log.info("Photo retrieved successfully: photoId={}, status={}",
                    query.photoId().value(), photo.getStatus());

            return photoDto;

        } catch (PhotoNotFoundException e) {
            log.error("Photo not found error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error processing get photo by ID query: photoId={}, userId={}",
                     query.photoId().value(), query.userId().value(), e);
            throw new RuntimeException("Failed to retrieve photo: " + e.getMessage(), e);
        }
    }
}

