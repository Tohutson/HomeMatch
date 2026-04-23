package com.propertystack.homematch.user;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        userRepository.findBySupabaseUserId(jwt.getSubject())
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
        if (email == null) {
            return null;
        }

        return email.trim().toLowerCase();
    }
}
