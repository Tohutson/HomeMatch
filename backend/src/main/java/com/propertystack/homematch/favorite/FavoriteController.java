package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@Validated
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteDTO> getFavorites(@RequestParam @Min(1) Long userId) {
        return favoriteService.getFavorites(userId);
    }

    @PostMapping
    public ResponseEntity<FavoriteDTO> addFavorite(
            @RequestParam @Min(1) Long userId,
            @RequestParam @Min(1) Long listingId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(favoriteService.addFavorite(userId, listingId));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeFavorite(
            @RequestParam @Min(1) Long userId,
            @RequestParam @Min(1) Long listingId) {
        favoriteService.removeFavorite(userId, listingId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/last")
    public ResponseEntity<Void> undoLastFavorite(
            @RequestParam @Min(1) Long userId) {
        favoriteService.undoLastFavorite(userId);
        return ResponseEntity.noContent().build();
    }
}
