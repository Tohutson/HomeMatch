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
        String email = jwt.getClaimAsString("email");

        return userRepository.findBySupabaseUserId(supabaseUserId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setSupabaseUserId(supabaseUserId);
                    user.setEmail(email);
                    return userRepository.save(user);
                });
    }

    @Transactional
    public void deleteCurrentUser(Jwt jwt) {
        userRepository.findBySupabaseUserId(jwt.getSubject())
                .ifPresent(userRepository::delete);
    }
}
