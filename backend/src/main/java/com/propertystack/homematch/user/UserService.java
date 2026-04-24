package com.propertystack.homematch.user;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SupabaseAdminClient supabaseAdminClient;

    public UserService(UserRepository userRepository, SupabaseAdminClient supabaseAdminClient) {
        this.userRepository = userRepository;
        this.supabaseAdminClient = supabaseAdminClient;
    }

    public User getOrCreateUser(Jwt jwt) {
        String supabaseUserId = jwt.getSubject();
        String email = normalizeEmail(jwt.getClaimAsString("email"));

        return userRepository.findBySupabaseUserId(supabaseUserId)
                .map(user -> syncEmail(user, email))
                .orElseGet(() -> createUser(supabaseUserId, email));
    }

    @Transactional
    public void deleteCurrentUser(Jwt jwt) {
        String supabaseUserId = jwt.getSubject();
        supabaseAdminClient.deleteUser(supabaseUserId);

        userRepository.findBySupabaseUserId(supabaseUserId)
                .ifPresent(userRepository::delete);
    }

    private User createUser(String supabaseUserId, String email) {
        User user = new User();
        user.setSupabaseUserId(supabaseUserId);
        user.setEmail(email);
        return userRepository.save(user);
    }

    private User syncEmail(User user, String email) {
        if (email == null || email.equals(user.getEmail())) {
            return user;
        }

        user.setEmail(email);
        return userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email.trim().toLowerCase();
    }
}
