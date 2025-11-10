package com.rapidphoto.features.photoquery;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestConfig.class)
class PhotoQueryIntegrationTest {

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
    private UserId otherUserId;
    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        userRepository.deleteAll();
        testUser = User.create("testuser", "password");
        testUser = userRepository.save(testUser);
        testUserId = new UserId(testUser.getId());
        otherUser = User.create("otheruser", "password");
        otherUser = userRepository.save(otherUser);
        otherUserId = new UserId(otherUser.getId());
        reset(s3Service);
    }

    @Test
    void shouldReturnUserPhotos() throws Exception {
        // Given
        String downloadUrl = "https://s3.amazonaws.com/test-bucket/test-key?signature=test";
        when(s3Service.generatePresignedDownloadUrl(anyString())).thenReturn(downloadUrl);

        // Create 5 photos for test user
        for (int i = 0; i < 5; i++) {
            Photo photo = Photo.createPending(testUser, "photo" + i + ".jpg", 1024L, "image/jpeg");
            if (i == 0) {
                // Make first photo COMPLETED to test download URL generation
                photo.markAsCompleted("users/" + testUserId.value() + "/photos/photo0.jpg");
            }
            photoRepository.save(photo);
        }

        // When
        String responseJson = mockMvc.perform(get("/api/photos")
                .param("userId", testUserId.value().toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoQueryResponse response = objectMapper.readValue(responseJson, PhotoQueryResponse.class);
        assertNotNull(response);
        assertEquals(5, response.photos().size());
        assertEquals(0, response.currentPage());
        assertEquals(1, response.totalPages());
        assertEquals(5L, response.totalElements());
        assertEquals(20, response.pageSize());

        // Verify photos are sorted by createdAt descending
        List<PhotoDto> photos = response.photos();
        for (int i = 0; i < photos.size() - 1; i++) {
            assertTrue(photos.get(i).createdAt().isAfter(photos.get(i + 1).createdAt()) ||
                      photos.get(i).createdAt().equals(photos.get(i + 1).createdAt()));
        }

        // Verify download URL is present for COMPLETED photo
        PhotoDto completedPhoto = photos.stream()
                .filter(p -> p.status() == UploadStatus.COMPLETED)
                .findFirst()
                .orElseThrow();
        assertNotNull(completedPhoto.downloadUrl());
    }

    @Test
    void shouldReturnEmptyListForUserWithNoPhotos() throws Exception {
        // Given - no photos for this user

        // When
        String responseJson = mockMvc.perform(get("/api/photos")
                .param("userId", testUserId.value().toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoQueryResponse response = objectMapper.readValue(responseJson, PhotoQueryResponse.class);
        assertNotNull(response);
        assertTrue(response.photos().isEmpty());
        assertEquals(0L, response.totalElements());
    }

    @Test
    void shouldPaginatePhotos() throws Exception {
        // Given
        // Create 25 photos for test user
        for (int i = 0; i < 25; i++) {
            Photo photo = Photo.createPending(testUser, "photo" + i + ".jpg", 1024L, "image/jpeg");
            photoRepository.save(photo);
        }

        // When - Request page 0 with size 10
        String responseJson1 = mockMvc.perform(get("/api/photos")
                .param("userId", testUserId.value().toString())
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoQueryResponse response1 = objectMapper.readValue(responseJson1, PhotoQueryResponse.class);
        assertEquals(10, response1.photos().size());
        assertEquals(0, response1.currentPage());
        assertEquals(3, response1.totalPages());
        assertEquals(25L, response1.totalElements());

        // When - Request page 1 with size 10
        String responseJson2 = mockMvc.perform(get("/api/photos")
                .param("userId", testUserId.value().toString())
                .param("page", "1")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoQueryResponse response2 = objectMapper.readValue(responseJson2, PhotoQueryResponse.class);
        assertEquals(10, response2.photos().size());
        assertEquals(1, response2.currentPage());
        assertEquals(3, response2.totalPages());
        assertEquals(25L, response2.totalElements());

        // Verify different photos on different pages
        assertNotEquals(response1.photos().get(0).photoId(), response2.photos().get(0).photoId());
    }

    @Test
    void shouldGetPhotoById() throws Exception {
        // Given
        Photo photo = Photo.createPending(testUser, "test.jpg", 1024L, "image/jpeg");
        String s3Key = "users/" + testUserId.value() + "/photos/test-key";
        photo.markAsCompleted(s3Key);
        photo = photoRepository.save(photo);
        
        String downloadUrl = "https://s3.amazonaws.com/test-bucket/test-key?signature=test";
        when(s3Service.generatePresignedDownloadUrl(s3Key)).thenReturn(downloadUrl);

        // When
        String responseJson = mockMvc.perform(get("/api/photos/{photoId}", photo.getId().value())
                .param("userId", testUserId.value().toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Then
        PhotoDto photoDto = objectMapper.readValue(responseJson, PhotoDto.class);
        assertNotNull(photoDto);
        assertEquals(photo.getId().value().toString(), photoDto.photoId());
        assertEquals("test.jpg", photoDto.fileName());
        assertEquals(UploadStatus.COMPLETED, photoDto.status());
        assertNotNull(photoDto.downloadUrl());
        assertEquals(downloadUrl, photoDto.downloadUrl());

        verify(s3Service).generatePresignedDownloadUrl(s3Key);
    }

    @Test
    void shouldReturn404ForNonExistentPhotoId() throws Exception {
        // Given
        PhotoId nonExistentPhotoId = PhotoId.generate();

        // When & Then
        mockMvc.perform(get("/api/photos/{photoId}", nonExistentPhotoId.value())
                .param("userId", testUserId.value().toString()))
                .andExpect(status().isNotFound());

        verify(s3Service, never()).generatePresignedDownloadUrl(anyString());
    }
}

