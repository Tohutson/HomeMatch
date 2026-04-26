package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.favorite.exception.FavoriteAlreadyExistsException;
import com.propertystack.homematch.favorite.exception.FavoriteNotFoundException;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingMapper listingMapper;

    @Mock
    private com.propertystack.homematch.user.SupabaseAdminClient supabaseAdminClient;

    @InjectMocks
    private FavoriteService favoriteService;

    @Test
    void addFavorite_shouldSaveAndReturnDTO() {
        User user = user(1L);
        Listing listing = listing(2L);
        Favorite saved = favorite(10L, user, listing);
        ListingDTO listingDTO = listingDto(listing);

        when(listingRepository.findById(2L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 2L)).thenReturn(false);
        when(userRepository.getReferenceById(1L)).thenReturn(user);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(saved);
        when(listingMapper.toDTO(listing)).thenReturn(listingDTO);

        FavoriteDTO result = favoriteService.addFavorite(1L, 2L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getListing()).isEqualTo(listingDTO);
        assertThat(result.getCreatedAt()).isEqualTo(saved.getCreatedAt());

        ArgumentCaptor<Favorite> favoriteCaptor = ArgumentCaptor.forClass(Favorite.class);
        verify(favoriteRepository).save(favoriteCaptor.capture());
        Favorite toSave = favoriteCaptor.getValue();
        assertThat(toSave.getUser()).isEqualTo(user);
        assertThat(toSave.getListing()).isEqualTo(listing);

        verify(listingRepository).findById(2L);
        verify(favoriteRepository).existsByUserIdAndListingId(1L, 2L);
        verify(userRepository).getReferenceById(1L);
        verify(listingMapper).toDTO(listing);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void addFavorite_shouldThrowWhenListingMissing() {
        when(listingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite(1L, 99L))
                .isInstanceOf(ListingNotFoundException.class);

        verify(listingRepository).findById(99L);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void addFavorite_shouldThrowWhenAlreadyFavorited() {
        Listing listing = listing(2L);

        when(listingRepository.findById(2L)).thenReturn(Optional.of(listing));
        when(favoriteRepository.existsByUserIdAndListingId(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> favoriteService.addFavorite(1L, 2L))
                .isInstanceOf(FavoriteAlreadyExistsException.class);

        verify(listingRepository).findById(2L);
        verify(favoriteRepository).existsByUserIdAndListingId(1L, 2L);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void removeFavorite_shouldDeleteExistingFavorite() {
        Favorite favorite = favorite(10L, user(1L), listing(2L));

        when(favoriteRepository.findByUserIdAndListingId(1L, 2L)).thenReturn(Optional.of(favorite));

        favoriteService.removeFavorite(1L, 2L);

        verify(favoriteRepository).findByUserIdAndListingId(1L, 2L);
        verify(favoriteRepository).delete(favorite);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void removeFavorite_shouldThrowWhenFavoriteMissing() {
        when(favoriteRepository.findByUserIdAndListingId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.removeFavorite(1L, 2L))
                .isInstanceOf(FavoriteNotFoundException.class);

        verify(favoriteRepository).findByUserIdAndListingId(1L, 2L);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void removeFavorite_shouldNotDeleteAnotherUsersFavorite() {
        when(favoriteRepository.findByUserIdAndListingId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.removeFavorite(1L, 2L))
                .isInstanceOf(FavoriteNotFoundException.class);

        verify(favoriteRepository).findByUserIdAndListingId(1L, 2L);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void getFavorites_shouldReturnMappedDTOs() {
        Listing listing = listing(2L);
        Favorite favorite = favorite(10L, user(1L), listing);
        ListingDTO listingDTO = listingDto(listing);

        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(favorite));
        when(listingMapper.toDTO(listing)).thenReturn(listingDTO);

        List<FavoriteDTO> result = favoriteService.getFavorites(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
        assertThat(result.get(0).getListing()).isEqualTo(listingDTO);
        assertThat(result.get(0).getCreatedAt()).isEqualTo(favorite.getCreatedAt());

        verify(favoriteRepository).findByUserIdOrderByCreatedAtDesc(1L);
        verify(listingMapper).toDTO(listing);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    @Test
    void getFavorites_shouldReturnEmptyListWhenNoFavoritesExist() {
        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        List<FavoriteDTO> result = favoriteService.getFavorites(1L);

        assertThat(result).isEmpty();

        verify(favoriteRepository).findByUserIdOrderByCreatedAtDesc(1L);
        verifyNoMoreInteractions(favoriteRepository, userRepository, listingRepository, listingMapper);
    }

    private User user(Long id) {
        return User.builder()
                .id(id)
                .supabaseUserId("supabase-user-" + id)
                .email("user" + id + "@example.com")
                .build();
    }

    private Listing listing(Long id) {
        return Listing.builder()
                .id(id)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .beds(3)
                .baths(1.5)
                .sqft(2250)
                .build();
    }

    private Favorite favorite(Long id, User user, Listing listing) {
        return Favorite.builder()
                .id(id)
                .user(user)
                .listing(listing)
                .createdAt(LocalDateTime.of(2026, 4, 5, 12, 0))
                .build();
    }

    private ListingDTO listingDto(Listing listing) {
        return ListingDTO.builder()
                .id(listing.getId())
                .address(listing.getAddress())
                .price(listing.getPrice())
                .beds(listing.getBeds())
                .baths(listing.getBaths())
                .sqft(listing.getSqft())
                .build();
    }
}
