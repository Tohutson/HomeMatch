package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           UserRepository userRepository,
                           ListingRepository listingRepository,
                           ListingMapper listingMapper) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
    }

    @Retryable(
        retryFor = { TransientDataAccessException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public FavoriteDTO addFavorite(Long userId, Long listingId) {
        User user = findUser(userId);
        Listing listing = findListing(listingId);

        if (favoriteRepository.existsByUserAndListing(user, listing)) {
            throw new IllegalStateException(
                    "Listing " + listingId +
                    " is already in favorites for user " + userId);
        }

        Favorite saved = favoriteRepository.save(
                Favorite.builder().user(user).listing(listing).build());
        return toDTO(saved);
    }

    @Recover
    public FavoriteDTO recoverAddFavorite(
            TransientDataAccessException ex, Long userId, Long listingId) {
        throw new IllegalStateException(
                "Unable to save favorite. Please try again.");
    }

    public void removeFavorite(Long userId, Long listingId) {
        User user = findUser(userId);
        Listing listing = findListing(listingId);
        favoriteRepository.deleteByUserAndListing(user, listing);
    }

    @Retryable(
        retryFor = { TransientDataAccessException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void undoLastFavorite(Long userId) {
        User user = findUser(userId);
        Favorite last = favoriteRepository
                .findTopByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new IllegalStateException(
                        "No favorites to undo for user " + userId));
        favoriteRepository.delete(last);
    }

    @Recover
    public void recoverUndoLastFavorite(
            TransientDataAccessException ex, Long userId) {
        throw new IllegalStateException("Unable to undo. Please try again.");
    }

    @Transactional(readOnly = true)
    public List<FavoriteDTO> getFavorites(Long userId) {
        User user = findUser(userId);
        return favoriteRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new EntityNotFoundException("User not found: " + userId));
    }

    private Listing findListing(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Listing not found: " + listingId));
    }

    private FavoriteDTO toDTO(Favorite favorite) {
        return FavoriteDTO.builder()
                .id(favorite.getId())
                .userId(favorite.getUser().getId())
                .listing(listingMapper.toDTO(favorite.getListing()))
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
