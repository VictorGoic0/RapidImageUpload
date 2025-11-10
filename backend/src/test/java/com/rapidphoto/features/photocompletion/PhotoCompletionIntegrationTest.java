package com.rapidphoto.features.photocompletion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rapidphoto.config.TestConfig;
import com.rapidphoto.domain.Photo;
import com.rapidphoto.domain.PhotoId;
import com.rapidphoto.domain.PhotoRepository;
import com.rapidphoto.domain.UploadStatus;
import com.rapidphoto.domain.User;
import com.rapidphoto.domain.UserId;
import com.rapidphoto.domain.UserRepository;
import com.rapidphoto.infrastructure.s3.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestConfig.class)
class PhotoCompletionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private S3Service s3Service;

    private UserId testUserId;
    private User testUser;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        userRepository.deleteAll();
        testUser = User.create("testuser", "password");
        testUser = userRepository.save(testUser);
        testUserId = new UserId(testUser.getId());
        reset(s3Service);
    }

    @Test
    void shouldCompletePhotoUpload() throws Exception {
        // Given
        Photo photo = Photo.createPending(testUser, "test.jpg", 1024L, "image/jpeg");
        photo = photoRepository.save(photo);
        String s3Key = "users/" + testUserId.value() + "/photos/test-key";
        
        PhotoCompletionController.CompletePhotoRequest request = 
            new PhotoCompletionController.CompletePhotoRequest(s3Key, null);

        when(s3Service.verifyObjectExists(s3Key)).thenReturn(true);

        // When
        String responseJson = mockMvc.perform(post("/api/photos/{photoId}/complete", photo.getId().value())
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoCompletionResponse response = objectMapper.readValue(responseJson, PhotoCompletionResponse.class);
        assertNotNull(response);
        assertEquals(photo.getId().value().toString(), response.photoId());
        assertEquals(UploadStatus.COMPLETED, response.status());
        assertNotNull(response.uploadedAt());

        // Verify database
        Photo savedPhoto = photoRepository.findById(photo.getId()).orElseThrow();
        assertEquals(UploadStatus.COMPLETED, savedPhoto.getStatus());
        assertNotNull(savedPhoto.getUploadedAt());
        assertEquals(s3Key, savedPhoto.getS3Key());

        verify(s3Service).verifyObjectExists(s3Key);
    }

    @Test
    void shouldReturn404ForNonExistentPhoto() throws Exception {
        // Given
        PhotoId nonExistentPhotoId = PhotoId.generate();
        String s3Key = "users/" + testUserId.value() + "/photos/test-key";
        
        PhotoCompletionController.CompletePhotoRequest request = 
            new PhotoCompletionController.CompletePhotoRequest(s3Key, null);

        // When & Then
        mockMvc.perform(post("/api/photos/{photoId}/complete", nonExistentPhotoId.value())
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        verify(s3Service, never()).verifyObjectExists(anyString());
    }

    @Test
    void shouldFailIfS3ObjectNotFound() throws Exception {
        // Given
        Photo photo = Photo.createPending(testUser, "test.jpg", 1024L, "image/jpeg");
        photo = photoRepository.save(photo);
        String s3Key = "users/" + testUserId.value() + "/photos/test-key";
        
        PhotoCompletionController.CompletePhotoRequest request = 
            new PhotoCompletionController.CompletePhotoRequest(s3Key, null);

        when(s3Service.verifyObjectExists(s3Key)).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/photos/{photoId}/complete", photo.getId().value())
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify photo status remains PENDING
        Photo savedPhoto = photoRepository.findById(photo.getId()).orElseThrow();
        assertEquals(UploadStatus.PENDING, savedPhoto.getStatus());
        assertNull(savedPhoto.getUploadedAt());

        verify(s3Service).verifyObjectExists(s3Key);
    }

    @Test
    void shouldRejectCompletingAlreadyCompletedPhoto() throws Exception {
        // Given
        Photo photo = Photo.createPending(testUser, "test.jpg", 1024L, "image/jpeg");
        String s3Key = "users/" + testUserId.value() + "/photos/test-key";
        photo.markAsCompleted(s3Key);
        photo = photoRepository.save(photo);
        
        PhotoCompletionController.CompletePhotoRequest request = 
            new PhotoCompletionController.CompletePhotoRequest(s3Key, null);

        when(s3Service.verifyObjectExists(s3Key)).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/photos/{photoId}/complete", photo.getId().value())
                .param("userId", testUserId.value().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify photo status remains COMPLETED
        Photo savedPhoto = photoRepository.findById(photo.getId()).orElseThrow();
        assertEquals(UploadStatus.COMPLETED, savedPhoto.getStatus());
    }
}

