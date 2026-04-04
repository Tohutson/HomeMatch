package com.propertystack.homematch.favorite;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FavoriteIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ListingRepository listingRepository;

    private User user;
    private Listing listing;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        listingRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder().build());
        listing = listingRepository.save(Listing.builder()
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .beds(3).baths(1.5).sqft(2250)
                .listingUrl("http://example.com").build());
    }

    @Test
    void addFavorite_shouldPersistAndReturn201() throws Exception {
        mockMvc.perform(post("/api/favorites")
                        .param("userId", user.getId().toString())
                        .param("listingId", listing.getId().toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.listing.id").value(listing.getId()))
                .andExpect(jsonPath("$.listing.address").value("30 Pitt St"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());

        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing)).isTrue();
    }

    @Test
    void addFavorite_shouldReturn409WhenAlreadyFavorited() throws Exception {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());

        mockMvc.perform(post("/api/favorites")
                        .param("userId", user.getId().toString())
                        .param("listingId", listing.getId().toString()))
                .andExpect(status().isConflict());
    }

    @Test
    void getFavorites_shouldReturnAllFavoritesForUser() throws Exception {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());

        mockMvc.perform(get("/api/favorites")
                        .param("userId", user.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].listing.address")
                        .value("30 Pitt St"))
                .andExpect(jsonPath("$[0].createdAt").isNotEmpty());
    }

    @Test
    void getFavorites_shouldReturn404ForUnknownUser() throws Exception {
        mockMvc.perform(get("/api/favorites").param("userId", "999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeFavorite_shouldDeleteFromDatabase() throws Exception {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());

        mockMvc.perform(delete("/api/favorites")
                        .param("userId", user.getId().toString())
                        .param("listingId", listing.getId().toString()))
                .andExpect(status().isNoContent());

        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing)).isFalse();
    }

    @Test
    void undoLastFavorite_shouldRemoveMostRecentFavorite() throws Exception {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());

        mockMvc.perform(delete("/api/favorites/last")
                        .param("userId", user.getId().toString()))
                .andExpect(status().isNoContent());

        assertThat(favoriteRepository
                .findByUserOrderByCreatedAtDesc(user)).isEmpty();
    }

    @Test
    void undoLastFavorite_shouldReturn409WhenNoFavoritesExist()
            throws Exception {
        mockMvc.perform(delete("/api/favorites/last")
                        .param("userId", user.getId().toString()))
                .andExpect(status().isConflict());
    }

    @Test
    void undoLastFavorite_shouldSupportSequentialUndos() throws Exception {
        Listing listing2 = listingRepository.save(Listing.builder()
                .address("40 Forbes Ave")
                .price(new BigDecimal("525000"))
                .beds(4).baths(3.0).sqft(3100)
                .listingUrl("http://example.com/2").build());

        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());
        Thread.sleep(20);
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing2).build());

        mockMvc.perform(delete("/api/favorites/last")
                        .param("userId", user.getId().toString()))
                .andExpect(status().isNoContent());
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing2)).isFalse();
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing)).isTrue();

        mockMvc.perform(delete("/api/favorites/last")
                        .param("userId", user.getId().toString()))
                .andExpect(status().isNoContent());
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing)).isFalse();
    }
}
