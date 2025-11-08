package com.rapidphoto.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, PhotoId> {
    
    List<Photo> findByUserIdOrderByCreatedAtDesc(UserId userId);
    
    Page<Photo> findByUserId(UserId userId, Pageable pageable);
    
    Optional<Photo> findByIdAndUserId(PhotoId id, UserId userId);
}

