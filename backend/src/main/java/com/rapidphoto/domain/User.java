package com.rapidphoto.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password; // Plain text for MVP
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Default constructor for JPA
    protected User() {
    }
    
    // Constructor with username and password
    private User(String username, String password) {
        this.username = username;
        this.password = password;
    }
    
    /**
     * Factory method to create a new User.
     * 
     * @param username The username (must be unique)
     * @param password The password (plain text for MVP)
     * @return A new User instance
     */
    public static User create(String username, String password) {
        return new User(username, password);
    }
    
    // Getters
    public UUID getId() {
        return id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    // Equals and hashCode based on id
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id != null && id.equals(user.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return String.format(
            "User{id=%s, username='%s', createdAt=%s}",
            id,
            username,
            createdAt
        );
    }
}

