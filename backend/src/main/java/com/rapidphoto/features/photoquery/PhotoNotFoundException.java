package com.rapidphoto.features.photoquery;

/**
 * Exception thrown when a photo is not found for the given ID and user.
 */
public class PhotoNotFoundException extends RuntimeException {

    public PhotoNotFoundException(String message) {
        super(message);
    }

    public PhotoNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

