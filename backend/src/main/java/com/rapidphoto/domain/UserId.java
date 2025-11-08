package com.rapidphoto.domain;

import jakarta.persistence.Embeddable;
import java.util.UUID;

@Embeddable
public record UserId(UUID value) {
    
    public UserId {
        if (value == null) {
            throw new IllegalArgumentException("UserId value cannot be null");
        }
    }
    
    public static UserId fromString(String uuid) {
        return new UserId(UUID.fromString(uuid));
    }
}

