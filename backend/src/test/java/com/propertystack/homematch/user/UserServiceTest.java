package com.propertystack.homematch.user;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupabaseAdminClient supabaseAdminClient;

    @InjectMocks
    private UserService userService;

    @Test
    void getOrCreateUser_shouldPersistNullEmailWhenClaimMissing() {
        Jwt jwt = jwt("supabase-user-1", null);
        User savedUser = User.builder()
                .id(1L)
                .supabaseUserId("supabase-user-1")
                .email(null)
                .build();

        when(userRepository.findBySupabaseUserId("supabase-user-1")).thenReturn(Optional.empty());
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class))).thenReturn(savedUser);

        User result = userService.getOrCreateUser(jwt);

        assertThat(result.getSupabaseUserId()).isEqualTo("supabase-user-1");
        assertThat(result.getEmail()).isNull();
        verify(userRepository).findBySupabaseUserId("supabase-user-1");
        verify(userRepository).save(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void deleteCurrentUser_shouldDeleteSupabaseAuthBeforeLocalUser() {
        Jwt jwt = jwt("supabase-user-1", "test@example.com");
        User existingUser = User.builder()
                .id(1L)
                .supabaseUserId("supabase-user-1")
                .email("test@example.com")
                .build();

        when(userRepository.findBySupabaseUserId("supabase-user-1")).thenReturn(Optional.of(existingUser));

        userService.deleteCurrentUser(jwt);

        org.mockito.InOrder inOrder = org.mockito.Mockito.inOrder(supabaseAdminClient, userRepository);
        inOrder.verify(supabaseAdminClient).deleteUser("supabase-user-1");
        inOrder.verify(userRepository).findBySupabaseUserId("supabase-user-1");
        inOrder.verify(userRepository).delete(existingUser);
    }

    @Test
    void deleteCurrentUser_shouldNotDeleteLocalUserWhenMissing() {
        Jwt jwt = jwt("supabase-user-2", "test@example.com");
        when(userRepository.findBySupabaseUserId("supabase-user-2")).thenReturn(Optional.empty());

        userService.deleteCurrentUser(jwt);

        verify(supabaseAdminClient).deleteUser("supabase-user-2");
        verify(userRepository).findBySupabaseUserId("supabase-user-2");
        verify(userRepository, never()).delete(org.mockito.ArgumentMatchers.any(User.class));
    }

    private Jwt jwt(String subject, String email) {
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(subject);

        if (email != null) {
            builder.claim("email", email);
        }

        return builder.claim("aud", "authenticated").build();
    }
}
