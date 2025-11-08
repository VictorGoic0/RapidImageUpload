package com.rapidphoto.infrastructure.s3;

/**
 * Custom exception for S3 upload-related errors.
 */
public class S3UploadException extends RuntimeException {

    public S3UploadException(String message) {
        super(message);
    }

    public S3UploadException(String message, Throwable cause) {
        super(message, cause);
    }

    public S3UploadException(Throwable cause) {
        super(cause);
    }
}

