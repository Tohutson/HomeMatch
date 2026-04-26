package com.propertystack.homematch.favorite;

import tools.jackson.databind.ObjectMapper;
import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.favorite.exception.FavoriteAlreadyExistsException;
import com.propertystack.homematch.favorite.exception.FavoriteNotFoundException;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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

@WebMvcTest(
        controllers = FavoriteController.class,
        excludeAutoConfiguration = OAuth2ResourceServerAutoConfiguration.class
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private FavoriteService favoriteService;

    @MockitoBean
    private UserService userService;

    @Test
    void getFavorites_shouldReturnListOfFavorites() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        when(favoriteService.getFavorites(1L)).thenReturn(List.of(sampleDto()));

        mockMvc.perform(get("/api/users/me/favorites").with(authenticatedJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].listing.id").value(1))
                .andExpect(jsonPath("$[0].listing.address").value("30 Pitt St"));

        verify(userService).getOrCreateUser(anyJwt());
        verify(favoriteService).getFavorites(1L);
        verifyNoMoreInteractions(userService, favoriteService);
    }

    @Test
    void getFavorites_shouldReturnEmptyList() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        when(favoriteService.getFavorites(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/users/me/favorites").with(authenticatedJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void addFavorite_shouldReturn201WithFavoriteDTO() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        when(favoriteService.addFavorite(1L, 1L)).thenReturn(sampleDto());

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":1}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.listing.id").value(1));

        verify(userService).getOrCreateUser(anyJwt());
        verify(favoriteService).addFavorite(1L, 1L);
        verifyNoMoreInteractions(userService, favoriteService);
    }

    @Test
    void addFavorite_shouldReturn400WhenRequestBodyIsInvalid() throws Exception {
        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":0}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addFavorite_shouldReturn404WhenListingNotFound() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        when(favoriteService.addFavorite(1L, 999L))
                .thenThrow(new ListingNotFoundException(999L));

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":999}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_shouldReturn409WhenAlreadyFavorited() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        when(favoriteService.addFavorite(1L, 1L))
                .thenThrow(new FavoriteAlreadyExistsException(1L, 1L));

        mockMvc.perform(post("/api/users/me/favorites")
                        .with(authenticatedJwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":1}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void removeFavorite_shouldReturn204() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        doNothing().when(favoriteService).removeFavorite(1L, 1L);

        mockMvc.perform(delete("/api/users/me/favorites/1").with(authenticatedJwt()))
                .andExpect(status().isNoContent());

        verify(userService).getOrCreateUser(anyJwt());
        verify(favoriteService).removeFavorite(1L, 1L);
        verifyNoMoreInteractions(userService, favoriteService);
    }

    @Test
    void removeFavorite_shouldReturn400WhenListingIdIsInvalid() throws Exception {
        mockMvc.perform(delete("/api/users/me/favorites/0").with(authenticatedJwt()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void removeFavorite_shouldReturn404WhenFavoriteNotFound() throws Exception {
        when(userService.getOrCreateUser(anyJwt())).thenReturn(sampleUser());
        doThrow(new FavoriteNotFoundException(1L, 999L))
                .when(favoriteService).removeFavorite(1L, 999L);

        mockMvc.perform(delete("/api/users/me/favorites/999").with(authenticatedJwt()))
                .andExpect(status().isNotFound());
    }

    private org.springframework.security.oauth2.jwt.Jwt anyJwt() {
        return org.mockito.ArgumentMatchers.any(org.springframework.security.oauth2.jwt.Jwt.class);
    }

    private RequestPostProcessor authenticatedJwt() {
        return request -> {
            request.setAttribute("jwt", sampleJwt());
            return request;
        };
    }

    private org.springframework.security.oauth2.jwt.Jwt sampleJwt() {
        return org.springframework.security.oauth2.jwt.Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("supabase-user-1")
                .claim("email", "test@example.com")
                .build();
    }

    private User sampleUser() {
        return User.builder()
                .id(1L)
                .supabaseUserId("supabase-user-1")
                .email("test@example.com")
                .build();
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

    @TestConfiguration
    static class JwtArgumentResolverConfig implements WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new HandlerMethodArgumentResolver() {
                @Override
                public boolean supportsParameter(MethodParameter parameter) {
                    return org.springframework.security.oauth2.jwt.Jwt.class
                            .isAssignableFrom(parameter.getParameterType());
                }

                @Override
                public Object resolveArgument(
                        MethodParameter parameter,
                        ModelAndViewContainer mavContainer,
                        NativeWebRequest webRequest,
                        WebDataBinderFactory binderFactory
                ) {
                    return webRequest.getAttribute("jwt", NativeWebRequest.SCOPE_REQUEST);
                }
            });
        }
    }
}
