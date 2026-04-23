package com.propertystack.homematch.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);

        return Map.of(
                "id", user.getId(),
                "sub", jwt.getSubject(),
                "supabaseUserId", user.getSupabaseUserId(),
                "email", user.getEmail()
        );
    }
}
