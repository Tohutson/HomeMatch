package com.propertystack.homematch.favorite;

import com.propertystack.homematch.config.SecurityConfig;
import com.propertystack.homematch.config.SecurityProperties;
import com.propertystack.homematch.config.RateLimitingFilter;
import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = FavoriteController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = RateLimitingFilter.class)
)
@Import(FavoriteSecurityTest.SecurityTestConfig.class)
@TestPropertySource(properties = {
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:54321/auth/v1",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:54321/auth/v1/.well-known/jwks.json",
        "app.security.jwt.audience=authenticated"
})
class FavoriteSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FavoriteService favoriteService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void shouldReturn401WhenTokenIsMissing() throws Exception {
        mockMvc.perform(get("/api/users/me/favorites"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAuthenticatedFavoriteWrite() throws Exception {
        when(jwtDecoder.decode("valid-token")).thenReturn(Jwt.withTokenValue("valid-token")
                .header("alg", "none")
                .subject("supabase-user-1")
                .claim("aud", "authenticated")
                .claim("email", "test@example.com")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build());
        when(userService.getOrCreateUser(any(Jwt.class))).thenReturn(User.builder()
                .id(1L)
                .supabaseUserId("supabase-user-1")
                .email("test@example.com")
                .build());
        when(favoriteService.addFavorite(1L, 42L)).thenReturn(FavoriteDTO.builder()
                .id(10L)
                .createdAt(LocalDateTime.of(2026, 4, 24, 12, 0))
                .listing(ListingDTO.builder()
                        .id(42L)
                        .address("42 Test St")
                        .photoUrls(List.of())
                        .build())
                .build());

        mockMvc.perform(post("/api/users/me/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId": 42}
                                """)
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isCreated());
    }

    @EnableConfigurationProperties(SecurityProperties.class)
    @Import(SecurityConfig.class)
    static class SecurityTestConfig {
    }
}
