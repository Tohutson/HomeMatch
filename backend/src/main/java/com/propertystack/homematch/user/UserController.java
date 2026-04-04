package com.propertystack.homematch.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<UserIdResponse> createAnonymousUser() {
        User saved = userRepository.save(User.builder().build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserIdResponse(saved.getId()));
    }

    public record UserIdResponse(Long id) {}
}
