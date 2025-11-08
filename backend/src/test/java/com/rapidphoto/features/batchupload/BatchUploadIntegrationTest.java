package com.rapidphoto.features.batchupload;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rapidphoto.config.TestConfig;
import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.domain.UploadStatus;
import com.rapidphoto.domain.UserId;
import com.rapidphoto.infrastructure.s3.S3Service;
import com.rapidphoto.infrastructure.s3.S3UploadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestConfig.class)
class BatchUploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private S3Service s3Service;

    private UserId testUserId;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        testUserId = new UserId(UUID.randomUUID());
        reset(s3Service);
    }

    @Test
    void shouldInitiateBatchUpload() throws Exception {
        // Given
        String testPresignedUrl = "https://s3.amazonaws.com/test-bucket/test-key?signature=test";
        String testS3Key = "users/" + testUserId.value() + "/photos/test-key";
        
        when(s3Service.generateS3Key(any(UserId.class), anyString()))
                .thenReturn(testS3Key);
        when(s3Service.generatePresignedUploadUrl(anyString(), anyString()))
                .thenReturn(testPresignedUrl);

        List<PhotoMetadata> photos = List.of(
            new PhotoMetadata("photo1.jpg", "image/jpeg", 1024L),
            new PhotoMetadata("photo2.png", "image/png", 2048L)
        );

        BatchUploadController.InitiateBatchUploadRequest request = 
            new BatchUploadController.InitiateBatchUploadRequest(photos);

        // When
        String responseJson = mockMvc.perform(post("/api/photos/batch-init")
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        BatchUploadResponse response = objectMapper.readValue(responseJson, BatchUploadResponse.class);
        assertNotNull(response);
        assertEquals(2, response.totalCount());
        assertEquals(2, response.uploads().size());
        
        response.uploads().forEach(upload -> {
            assertNotNull(upload.photoId());
            assertNotNull(upload.presignedUrl());
            assertNotNull(upload.s3Key());
            assertNotNull(upload.expiresAt());
            assertTrue(upload.expiresAt().isAfter(Instant.now()));
        });

        // Verify database
        List<Photo> savedPhotos = photoRepository.findAll();
        assertEquals(2, savedPhotos.size());
        savedPhotos.forEach(photo -> {
            assertEquals(UploadStatus.PENDING, photo.getStatus());
            assertEquals(testUserId, photo.getUserId());
        });

        // Verify S3Service was called
        verify(s3Service, times(2)).generateS3Key(any(UserId.class), anyString());
        verify(s3Service, times(2)).generatePresignedUploadUrl(anyString(), anyString());
    }

    @Test
    void shouldRejectEmptyPhotoList() throws Exception {
        // Given
        BatchUploadController.InitiateBatchUploadRequest request = 
            new BatchUploadController.InitiateBatchUploadRequest(new ArrayList<>());

        // When & Then
        mockMvc.perform(post("/api/photos/batch-init")
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify no photos were saved
        assertEquals(0, photoRepository.count());
    }

    @Test
    void shouldRejectMoreThan100Photos() throws Exception {
        // Given
        List<PhotoMetadata> photos = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            photos.add(new PhotoMetadata("photo" + i + ".jpg", "image/jpeg", 1024L));
        }

        BatchUploadController.InitiateBatchUploadRequest request = 
            new BatchUploadController.InitiateBatchUploadRequest(photos);

        // When & Then
        mockMvc.perform(post("/api/photos/batch-init")
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify no photos were saved
        assertEquals(0, photoRepository.count());
    }

    @Test
    void shouldHandleS3ServiceFailure() throws Exception {
        // Given
        when(s3Service.generateS3Key(any(UserId.class), anyString()))
                .thenThrow(new S3UploadException("S3 service unavailable"));

        List<PhotoMetadata> photos = List.of(
            new PhotoMetadata("photo1.jpg", "image/jpeg", 1024L)
        );

        BatchUploadController.InitiateBatchUploadRequest request = 
            new BatchUploadController.InitiateBatchUploadRequest(photos);

        // When & Then
        mockMvc.perform(post("/api/photos/batch-init")
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());

        // Verify transaction rollback - no photos saved
        assertEquals(0, photoRepository.count());
    }
}

