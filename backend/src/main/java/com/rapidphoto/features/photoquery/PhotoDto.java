package com.rapidphoto.features.photoquery;

import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.UploadStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Data Transfer Object for Photo information.
 */
public record PhotoDto(
    String photoId,
    String fileName,
    UploadStatus status,
    Long fileSize,
    String contentType,
    Instant createdAt,
    Instant uploadedAt,
    String downloadUrl
) {
    /**
     * Factory method to create PhotoDto from domain Photo entity.
     * 
     * @param photo The Photo domain entity
     * @param downloadUrl The presigned download URL (null if photo is not COMPLETED)
     * @return PhotoDto instance
     */
    public static PhotoDto fromDomain(Photo photo, String downloadUrl) {
        return new PhotoDto(
            photo.getId().value().toString(),
            photo.getFileName(),
            photo.getStatus(),
            photo.getFileSize(),
            photo.getContentType(),
            convertToInstant(photo.getCreatedAt()),
            convertToInstant(photo.getUploadedAt()),
            downloadUrl
        );
    }
    
    private static Instant convertToInstant(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZoneId.systemDefault()).toInstant();
    }
}

