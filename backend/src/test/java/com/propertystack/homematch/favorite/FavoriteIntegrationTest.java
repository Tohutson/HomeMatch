package com.propertystack.homematch.favorite;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.propertystack.homematch.favorite.dto.CreateFavoriteRequest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class FavoriteIntegrationTest {

    @Container
    static PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);

        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    private User user;
    private Listing listing;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        listingRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .supabaseUserId("supabase-user-1")
                .email("test@example.com")
                .build());

        listing = listingRepository.save(Listing.builder()
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .beds(3)
                .baths(1.5)
                .sqft(2250)
                .listingUrl("http://example.com")
                .build());
    }

    @Test
    void addFavorite_shouldPersistAndReturn201() throws Exception {
        CreateFavoriteRequest request = new CreateFavoriteRequest(listing.getId());

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.listing.id").value(listing.getId()))
                .andExpect(jsonPath("$.listing.address").value("30 Pitt St"));

        assertThat(favoriteRepository.existsByUserIdAndListingId(user.getId(), listing.getId()))
                .isTrue();
    }

    @Test
    void addFavorite_shouldReturn409WhenAlreadyFavorited() throws Exception {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing)
                .build());

        CreateFavoriteRequest request = new CreateFavoriteRequest(listing.getId());

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void addFavorite_shouldReturn404WhenListingDoesNotExist() throws Exception {
        CreateFavoriteRequest request = new CreateFavoriteRequest(999999L);

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_shouldReturn400WhenRequestBodyIsInvalid() throws Exception {
        CreateFavoriteRequest request = new CreateFavoriteRequest(0L);

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getFavorites_shouldReturnAllFavoritesForUser() throws Exception {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing)
                .build());

        mockMvc.perform(get("/api/users/me/favorites").with(authenticatedJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].listing.id").value(listing.getId()))
                .andExpect(jsonPath("$[0].listing.address").value("30 Pitt St"));
    }

    @Test
    void getFavorites_shouldReturnEmptyListWhenUserHasNoFavorites() throws Exception {
        mockMvc.perform(get("/api/users/me/favorites").with(authenticatedJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getFavorites_shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/me/favorites"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getFavorites_shouldCreateUserForAuthenticatedSupabaseSubject() throws Exception {
        userRepository.delete(user);

        mockMvc.perform(get("/api/users/me/favorites").with(authenticatedJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        assertThat(userRepository.findBySupabaseUserId("supabase-user-1"))
                .isPresent()
                .get()
                .extracting(User::getEmail)
                .isEqualTo("test@example.com");
    }

    @Test
    void removeFavorite_shouldDeleteFromDatabase() throws Exception {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing)
                .build());

        mockMvc.perform(delete("/api/users/me/favorites/{listingId}", listing.getId())
                        .with(authenticatedJwt()))
                .andExpect(status().isNoContent());

        assertThat(favoriteRepository.existsByUserIdAndListingId(user.getId(), listing.getId()))
                .isFalse();
    }

    @Test
    void removeFavorite_shouldReturn404WhenFavoriteDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/users/me/favorites/{listingId}", listing.getId())
                        .with(authenticatedJwt()))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeFavorite_shouldReturn400WhenListingIdIsInvalid() throws Exception {
        mockMvc.perform(delete("/api/users/me/favorites/{listingId}", 0)
                        .with(authenticatedJwt()))
                .andExpect(status().isBadRequest());
    }

    private RequestPostProcessor authenticatedJwt() {
        return jwt().jwt(jwt -> jwt
                .subject("supabase-user-1")
                .claim("email", "test@example.com"));
    }
}
