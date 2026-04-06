package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.CreateFavoriteRequest;
import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/favorites")
@Validated
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteDTO> getFavorites(@PathVariable @Min(1) Long userId) {
        return favoriteService.getFavorites(userId);
    }

    @PostMapping
    public ResponseEntity<FavoriteDTO> addFavorite(
            @PathVariable @Min(1) Long userId,
            @Valid @RequestBody CreateFavoriteRequest request) {

        FavoriteDTO favorite = favoriteService.addFavorite(userId, request.listingId());
        return ResponseEntity.status(HttpStatus.CREATED).body(favorite);
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable @Min(1) Long userId,
            @PathVariable @Min(1) Long listingId) {

        favoriteService.removeFavorite(userId, listingId);
        return ResponseEntity.noContent().build();
    }
}
