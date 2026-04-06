package com.propertystack.homematch.favorite;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.favorite.exception.FavoriteAlreadyExistsException;
import com.propertystack.homematch.favorite.exception.FavoriteNotFoundException;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FavoriteController.class)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private FavoriteService favoriteService;

    @Test
    void getFavorites_shouldReturnListOfFavorites() throws Exception {
        when(favoriteService.getFavorites(1L)).thenReturn(List.of(sampleDto()));

        mockMvc.perform(get("/api/users/1/favorites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].listing.id").value(1))
                .andExpect(jsonPath("$[0].listing.address").value("30 Pitt St"));

        verify(favoriteService).getFavorites(1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void getFavorites_shouldReturnEmptyList() throws Exception {
        when(favoriteService.getFavorites(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/users/1/favorites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getFavorites_shouldReturn400WhenUserIdIsInvalid() throws Exception {
        mockMvc.perform(get("/api/users/0/favorites"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addFavorite_shouldReturn201WithFavoriteDTO() throws Exception {
        when(favoriteService.addFavorite(1L, 1L)).thenReturn(sampleDto());

        mockMvc.perform(post("/api/users/1/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":1}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.listing.id").value(1));

        verify(favoriteService).addFavorite(1L, 1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void addFavorite_shouldReturn400WhenRequestBodyIsInvalid() throws Exception {
        mockMvc.perform(post("/api/users/1/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":0}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addFavorite_shouldReturn404WhenListingNotFound() throws Exception {
        when(favoriteService.addFavorite(1L, 999L))
                .thenThrow(new ListingNotFoundException(999L));

        mockMvc.perform(post("/api/users/1/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":999}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_shouldReturn409WhenAlreadyFavorited() throws Exception {
        when(favoriteService.addFavorite(1L, 1L))
                .thenThrow(new FavoriteAlreadyExistsException(1L, 1L));

        mockMvc.perform(post("/api/users/1/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":1}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void removeFavorite_shouldReturn204() throws Exception {
        doNothing().when(favoriteService).removeFavorite(1L, 1L);

        mockMvc.perform(delete("/api/users/1/favorites/1"))
                .andExpect(status().isNoContent());

        verify(favoriteService).removeFavorite(1L, 1L);
        verifyNoMoreInteractions(favoriteService);
    }

    @Test
    void removeFavorite_shouldReturn400WhenListingIdIsInvalid() throws Exception {
        mockMvc.perform(delete("/api/users/1/favorites/0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void removeFavorite_shouldReturn404WhenFavoriteNotFound() throws Exception {
        doThrow(new FavoriteNotFoundException(1L, 999L))
                .when(favoriteService).removeFavorite(1L, 999L);

        mockMvc.perform(delete("/api/users/1/favorites/999"))
                .andExpect(status().isNotFound());
    }

    private FavoriteDTO sampleDto() {
        return FavoriteDTO.builder()
                .id(1L)
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
                .createdAt(LocalDateTime.of(2026, 4, 5, 12, 0))
                .build();
    }
}