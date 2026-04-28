package com.propertystack.homematch.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.core.MethodParameter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserController.class,
        excludeAutoConfiguration = OAuth2ResourceServerAutoConfiguration.class
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void me_shouldReturnAuthenticatedProfileWithoutInternalNumericId() throws Exception {
        when(userService.getOrCreateUser(any(Jwt.class))).thenReturn(User.builder()
                .id(7L)
                .supabaseUserId("supabase-user-1")
                .email("test@example.com")
                .build());

        mockMvc.perform(get("/api/users/me").with(authenticatedJwt("test@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sub").value("supabase-user-1"))
                .andExpect(jsonPath("$.supabaseUserId").value("supabase-user-1"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.id").doesNotExist());

        verify(userService).getOrCreateUser(any(Jwt.class));
    }

    @Test
    void me_shouldReturnEmptyEmailStringWhenClaimMissing() throws Exception {
        when(userService.getOrCreateUser(any(Jwt.class))).thenReturn(User.builder()
                .id(7L)
                .supabaseUserId("supabase-user-1")
                .email(null)
                .build());

        mockMvc.perform(get("/api/users/me").with(authenticatedJwt(null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(""));
    }

    private RequestPostProcessor authenticatedJwt(String email) {
        return request -> {
            request.setAttribute("jwt", sampleJwt(email));
            return request;
        };
    }

    private Jwt sampleJwt(String email) {
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("supabase-user-1")
                .claim("aud", "authenticated");

        if (email != null) {
            builder.claim("email", email);
        }

        return builder.build();
    }

    @TestConfiguration
    static class JwtArgumentResolverConfig implements WebMvcConfigurer {
        @Override
        public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
            resolvers.add(new HandlerMethodArgumentResolver() {
                @Override
                public boolean supportsParameter(MethodParameter parameter) {
                    return Jwt.class.isAssignableFrom(parameter.getParameterType());
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
