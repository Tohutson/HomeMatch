package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.CreateFavoriteRequest;
import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/favorites")
@Validated
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserService userService;

    public FavoriteController(FavoriteService favoriteService, UserService userService) {
        this.favoriteService = favoriteService;
        this.userService = userService;
    }

    @GetMapping
    public List<FavoriteDTO> getFavorites(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        return favoriteService.getFavorites(user.getId());
    }

    @PostMapping
    public ResponseEntity<FavoriteDTO> addFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateFavoriteRequest request) {

        User user = userService.getOrCreateUser(jwt);
        FavoriteDTO favorite = favoriteService.addFavorite(user.getId(), request.listingId());
        return ResponseEntity.status(HttpStatus.CREATED).body(favorite);
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> removeFavorite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @Min(1) Long listingId) {

        User user = userService.getOrCreateUser(jwt);
        favoriteService.removeFavorite(user.getId(), listingId);
        return ResponseEntity.noContent().build();
    }
}
