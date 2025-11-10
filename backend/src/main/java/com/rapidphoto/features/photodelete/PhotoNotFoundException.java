package com.rapidphoto.features.photodelete;

/**
 * Exception thrown when a photo is not found for the given ID.
 */
public class PhotoNotFoundException extends RuntimeException {

    public PhotoNotFoundException(String message) {
        super(message);
    }

    public PhotoNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

