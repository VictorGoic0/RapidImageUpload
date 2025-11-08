package com.rapidphoto.domain;

import jakarta.persistence.Embeddable;
import java.util.UUID;

@Embeddable
public record PhotoId(UUID value) {
    
    public PhotoId {
        if (value == null) {
            throw new IllegalArgumentException("PhotoId value cannot be null");
        }
    }
    
    public static PhotoId generate() {
        return new PhotoId(UUID.randomUUID());
    }
    
    public static PhotoId fromString(String uuid) {
        return new PhotoId(UUID.fromString(uuid));
    }
}

