package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.TransientDataAccessResourceException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock private FavoriteRepository favoriteRepository;
    @Mock private UserRepository userRepository;
    @Mock private ListingRepository listingRepository;
    @Mock private ListingMapper listingMapper;

    @InjectMocks
    private FavoriteService favoriteService;

    // ── addFavorite ────────────────────────────────────────────────────────

    @Test
    void addFavorite_shouldSaveAndReturnDTO() {
        User user = user(1L);
        Listing listing = listing(1L);
        Favorite saved = favorite(10L, user, listing);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserAndListing(user, listing))
                .thenReturn(false);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(saved);
        when(listingMapper.toDTO(listing)).thenReturn(listingDto(listing));

        FavoriteDTO result = favoriteService.addFavorite(1L, 1L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getListing().getId()).isEqualTo(1L);
        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    void addFavorite_shouldThrowEntityNotFoundWhenUserMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite(99L, 1L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");

        verifyNoInteractions(favoriteRepository);
    }

    @Test
    void addFavorite_shouldThrowEntityNotFoundWhenListingMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(listingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite(1L, 99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Listing not found");

        verifyNoInteractions(favoriteRepository);
    }

    @Test
    void addFavorite_shouldThrowIllegalStateWhenAlreadyFavorited() {
        User user = user(1L);
        Listing listing = listing(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserAndListing(user, listing))
                .thenReturn(true);

        assertThatThrownBy(() -> favoriteService.addFavorite(1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already in favorites");

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void addFavorite_recoverShouldThrowIllegalStateWhenAllRetriesExhausted() {
        TransientDataAccessResourceException ex =
                new TransientDataAccessResourceException("db down");

        assertThatThrownBy(() ->
                favoriteService.recoverAddFavorite(ex, 1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Unable to save favorite. Please try again.");
    }

    // ── removeFavorite ─────────────────────────────────────────────────────

    @Test
    void removeFavorite_shouldCallDeleteByUserAndListing() {
        User user = user(1L);
        Listing listing = listing(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        favoriteService.removeFavorite(1L, 1L);

        verify(favoriteRepository).deleteByUserAndListing(user, listing);
    }

    @Test
    void removeFavorite_shouldThrowEntityNotFoundWhenUserMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.removeFavorite(99L, 1L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    // ── undoLastFavorite ───────────────────────────────────────────────────

    @Test
    void undoLastFavorite_shouldDeleteMostRecentFavorite() {
        User user = user(1L);
        Favorite last = favorite(5L, user, listing(3L));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(favoriteRepository.findTopByUserOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(last));

        favoriteService.undoLastFavorite(1L);

        verify(favoriteRepository).delete(last);
    }

    @Test
    void undoLastFavorite_shouldThrowIllegalStateWhenStackEmpty() {
        User user = user(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(favoriteRepository.findTopByUserOrderByCreatedAtDesc(user))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.undoLastFavorite(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No favorites to undo");
    }

    @Test
    void undoLastFavorite_shouldSupportSequentialUndos() {
        User user = user(1L);
        Favorite first  = favorite(1L, user, listing(1L));
        Favorite second = favorite(2L, user, listing(2L));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(favoriteRepository.findTopByUserOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(second))
                .thenReturn(Optional.of(first));

        favoriteService.undoLastFavorite(1L);
        favoriteService.undoLastFavorite(1L);

        verify(favoriteRepository).delete(second);
        verify(favoriteRepository).delete(first);
    }

    @Test
    void undoLastFavorite_recoverShouldThrowIllegalStateWhenAllRetriesExhausted() {
        TransientDataAccessResourceException ex =
                new TransientDataAccessResourceException("db down");

        assertThatThrownBy(() ->
                favoriteService.recoverUndoLastFavorite(ex, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Unable to undo. Please try again.");
    }

    // ── getFavorites ───────────────────────────────────────────────────────

    @Test
    void getFavorites_shouldReturnMappedDTOsNewestFirst() {
        User user = user(1L);
        Listing listing = listing(1L);
        Favorite fav = favorite(1L, user, listing);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(favoriteRepository.findByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(fav));
        when(listingMapper.toDTO(listing)).thenReturn(listingDto(listing));

        List<FavoriteDTO> result = favoriteService.getFavorites(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void getFavorites_shouldReturnEmptyListWhenNoneExist() {
        User user = user(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(favoriteRepository.findByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of());

        List<FavoriteDTO> result = favoriteService.getFavorites(1L);

        assertThat(result).isEmpty();
        verifyNoInteractions(listingMapper);
    }

    @Test
    void getFavorites_shouldThrowEntityNotFoundWhenUserMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.getFavorites(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private User user(Long id) {
        return User.builder().id(id).build();
    }

    private Listing listing(Long id) {
        return Listing.builder()
                .id(id).address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .beds(3).baths(1.5).sqft(2250)
                .build();
    }

    private Favorite favorite(Long id, User user, Listing listing) {
        return Favorite.builder()
                .id(id).user(user).listing(listing)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ListingDTO listingDto(Listing listing) {
        return ListingDTO.builder()
                .id(listing.getId()).address(listing.getAddress())
                .price(listing.getPrice()).beds(listing.getBeds())
                .baths(listing.getBaths()).sqft(listing.getSqft())
                .build();
    }
}
