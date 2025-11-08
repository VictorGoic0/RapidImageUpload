package com.rapidphoto.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
public class Photo {
    
    @EmbeddedId
    private PhotoId id;
    
    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "user_id", nullable = false))
    private UserId userId;
    
    @Column(nullable = false)
    private String fileName;
    
    @Column(name = "s3_key")
    private String s3Key;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UploadStatus status;
    
    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @Column(name = "content_type", nullable = false)
    private String contentType;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
    
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    // Default constructor for JPA
    protected Photo() {
    }
    
    // Private constructor for factory methods
    private Photo(PhotoId id, UserId userId, String fileName, Long fileSize, String contentType) {
        this.id = id;
        this.userId = userId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.status = UploadStatus.PENDING;
    }
    
    public static Photo createPending(UserId userId, String fileName, Long fileSize, String contentType) {
        return new Photo(PhotoId.generate(), userId, fileName, fileSize, contentType);
    }
    
    public void markAsCompleted(String s3Key) {
        if (this.status != UploadStatus.PENDING && this.status != UploadStatus.UPLOADING) {
            throw new IllegalStateException(
                String.format("Cannot mark photo as completed. Current status: %s", this.status)
            );
        }
        this.s3Key = s3Key;
        this.status = UploadStatus.COMPLETED;
        this.uploadedAt = LocalDateTime.now();
    }
    
    public void markAsFailed(String errorMessage) {
        this.status = UploadStatus.FAILED;
        this.errorMessage = errorMessage;
    }
    
    public void markAsUploading() {
        if (this.status != UploadStatus.PENDING) {
            throw new IllegalStateException(
                String.format("Cannot mark photo as uploading. Current status: %s", this.status)
            );
        }
        this.status = UploadStatus.UPLOADING;
    }
    
    // Getters
    public PhotoId getId() {
        return id;
    }
    
    public UserId getUserId() {
        return userId;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public String getS3Key() {
        return s3Key;
    }
    
    public UploadStatus getStatus() {
        return status;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    // Equals and hashCode based on PhotoId
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Photo photo = (Photo) o;
        return id != null && id.equals(photo.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return String.format(
            "Photo{id=%s, userId=%s, fileName='%s', status=%s, fileSize=%d, contentType='%s'}",
            id != null ? id.value() : null,
            userId != null ? userId.value() : null,
            fileName,
            status,
            fileSize,
            contentType
        );
    }
}

