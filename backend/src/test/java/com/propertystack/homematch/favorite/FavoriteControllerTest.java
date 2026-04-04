package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.listing.dto.ListingDTO;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FavoriteController.class)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FavoriteService favoriteService;

    // ── GET /api/favorites ─────────────────────────────────────────────────

    @Test
    void getFavorites_shouldReturnListOfFavorites() throws Exception {
        when(favoriteService.getFavorites(1L)).thenReturn(List.of(sampleDto()));

        mockMvc.perform(get("/api/favorites").param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].userId").value(1))
                .andExpect(jsonPath("$[0].listing.id").value(1))
                .andExpect(jsonPath("$[0].listing.address").value("30 Pitt St"));

        verify(favoriteService).getFavorites(1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void getFavorites_shouldReturnEmptyList() throws Exception {
        when(favoriteService.getFavorites(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/favorites").param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getFavorites_shouldReturn404WhenUserNotFound() throws Exception {
        when(favoriteService.getFavorites(999L))
                .thenThrow(new EntityNotFoundException("User not found: 999"));

        mockMvc.perform(get("/api/favorites").param("userId", "999"))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/favorites ────────────────────────────────────────────────

    @Test
    void addFavorite_shouldReturn201WithFavoriteDTO() throws Exception {
        when(favoriteService.addFavorite(1L, 1L)).thenReturn(sampleDto());

        mockMvc.perform(post("/api/favorites")
                        .param("userId", "1")
                        .param("listingId", "1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.listing.id").value(1));

        verify(favoriteService).addFavorite(1L, 1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void addFavorite_shouldReturn409WhenAlreadyFavorited() throws Exception {
        when(favoriteService.addFavorite(1L, 1L))
                .thenThrow(new IllegalStateException(
                        "Listing 1 is already in favorites for user 1"));

        mockMvc.perform(post("/api/favorites")
                        .param("userId", "1")
                        .param("listingId", "1"))
                .andExpect(status().isConflict());
    }

    @Test
    void addFavorite_shouldReturn404WhenListingNotFound() throws Exception {
        when(favoriteService.addFavorite(1L, 999L))
                .thenThrow(new EntityNotFoundException("Listing not found: 999"));

        mockMvc.perform(post("/api/favorites")
                        .param("userId", "1")
                        .param("listingId", "999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_shouldReturn404WhenUserNotFound() throws Exception {
        when(favoriteService.addFavorite(999L, 1L))
                .thenThrow(new EntityNotFoundException("User not found: 999"));

        mockMvc.perform(post("/api/favorites")
                        .param("userId", "999")
                        .param("listingId", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_shouldReturn503WhenAllRetriesExhausted() throws Exception {
        when(favoriteService.addFavorite(1L, 1L))
                .thenThrow(new IllegalStateException(
                        "Unable to save favorite. Please try again."));

        mockMvc.perform(post("/api/favorites")
                        .param("userId", "1")
                        .param("listingId", "1"))
                .andExpect(status().isServiceUnavailable());
    }

    // ── DELETE /api/favorites ──────────────────────────────────────────────

    @Test
    void removeFavorite_shouldReturn204() throws Exception {
        doNothing().when(favoriteService).removeFavorite(1L, 1L);

        mockMvc.perform(delete("/api/favorites")
                        .param("userId", "1")
                        .param("listingId", "1"))
                .andExpect(status().isNoContent());

        verify(favoriteService).removeFavorite(1L, 1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void removeFavorite_shouldReturn404WhenUserNotFound() throws Exception {
        doThrow(new EntityNotFoundException("User not found: 999"))
                .when(favoriteService).removeFavorite(999L, 1L);

        mockMvc.perform(delete("/api/favorites")
                        .param("userId", "999")
                        .param("listingId", "1"))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/favorites/last ─────────────────────────────────────────

    @Test
    void undoLastFavorite_shouldReturn204() throws Exception {
        doNothing().when(favoriteService).undoLastFavorite(1L);

        mockMvc.perform(delete("/api/favorites/last").param("userId", "1"))
                .andExpect(status().isNoContent());

        verify(favoriteService).undoLastFavorite(1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void undoLastFavorite_shouldReturn409WhenNoFavoritesToUndo() throws Exception {
        doThrow(new IllegalStateException("No favorites to undo for user 1"))
                .when(favoriteService).undoLastFavorite(1L);

        mockMvc.perform(delete("/api/favorites/last").param("userId", "1"))
                .andExpect(status().isConflict());
    }

    @Test
    void undoLastFavorite_shouldReturn404WhenUserNotFound() throws Exception {
        doThrow(new EntityNotFoundException("User not found: 999"))
                .when(favoriteService).undoLastFavorite(999L);

        mockMvc.perform(delete("/api/favorites/last").param("userId", "999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void undoLastFavorite_shouldReturn503WhenAllRetriesExhausted() throws Exception {
        doThrow(new IllegalStateException("Unable to undo. Please try again."))
                .when(favoriteService).undoLastFavorite(1L);

        mockMvc.perform(delete("/api/favorites/last").param("userId", "1"))
                .andExpect(status().isServiceUnavailable());
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private FavoriteDTO sampleDto() {
        return FavoriteDTO.builder()
                .id(1L)
                .userId(1L)
                .listing(ListingDTO.builder()
                        .id(1L)
                        .address("30 Pitt St")
                        .price(new BigDecimal("250000"))
                        .sqft(2250)
                        .beds(3)
                        .baths(1.5)
                        .listingUrl("http://example.com")
                        .photoUrls(List.of("url1.jpg"))
                        .build())
                .createdAt(LocalDateTime.now())
                .build();
    }
}
