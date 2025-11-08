package com.rapidphoto.features.photocompletion;

/**
 * Exception thrown when S3 object verification fails.
 */
public class S3VerificationException extends RuntimeException {

    public S3VerificationException(String message) {
        super(message);
    }

    public S3VerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}

