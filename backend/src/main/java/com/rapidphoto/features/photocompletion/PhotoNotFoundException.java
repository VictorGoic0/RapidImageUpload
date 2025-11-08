package com.rapidphoto.features.photocompletion;

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

