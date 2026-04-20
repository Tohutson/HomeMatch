package com.propertystack.homematch.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<UserIdResponse> createAnonymousUser() {
        User saved = userRepository.save(User.builder().build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserIdResponse(saved.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginOrCreateUser(
            @Valid @RequestBody LoginRequest request
    ) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        String rawPassword = request.password();

        return userRepository.findByEmail(normalizedEmail)
                .<ResponseEntity<?>>map(existingUser -> {
                    String storedHash = existingUser.getPasswordHash();

                    if (storedHash == null || storedHash.isBlank()) {
                        existingUser.setPasswordHash(passwordEncoder.encode(rawPassword));
                        existingUser.setProvider(AuthProvider.LOCAL);
                        existingUser.setVerified(true);

                        User updatedUser = userRepository.save(existingUser);
                        return ResponseEntity.ok(new UserIdResponse(updatedUser.getId()));
                    }

                    if (!passwordEncoder.matches(rawPassword, storedHash)) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(new ErrorResponse("Invalid email or password"));
                    }

                    return ResponseEntity.ok(new UserIdResponse(existingUser.getId()));
                })
                .orElseGet(() -> {
                    User createdUser = userRepository.save(
                            User.builder()
                                    .email(normalizedEmail)
                                    .passwordHash(passwordEncoder.encode(rawPassword))
                                    .provider(AuthProvider.LOCAL)
                                    .verified(true)
                                    .build()
                    );

                    return ResponseEntity.ok(new UserIdResponse(createdUser.getId()));
                });
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 72) String password
    ) {}

    public record ErrorResponse(String message) {}

    public record UserIdResponse(Long id) {}
}
