package com.propertystack.homematch.recommendation;

import com.propertystack.homematch.favorite.Favorite;
import com.propertystack.homematch.favorite.FavoriteRepository;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingPageResponse;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private RecommendationSessionRepository recommendationSessionRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingMapper listingMapper;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-25T12:00:00Z"), ZoneOffset.UTC);
        recommendationService = new RecommendationService(
                recommendationSessionRepository,
                favoriteRepository,
                listingRepository,
                listingMapper,
                clock
        );
    }

    @Test
    void recommendedListings_shouldCreateFallbackSessionWhenUserHasNoFavorites() {
        Listing listing = listing(10L, "15213", "300000", 3, 2.0, 1600, 80);
        ListingDTO dto = ListingDTO.builder().id(10L).build();

        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(recommendationSessionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(listingRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(listing), PageRequest.of(0, 12), 1));
        when(listingMapper.toDTO(listing)).thenReturn(dto);

        ListingPageResponse result = recommendationService.getRecommendedListings(
                1L,
                emptyFilter(),
                PageRequest.of(0, 12),
                null
        );

        assertThat(result.content()).containsExactly(dto);
        assertThat(result.usingRecommendationFallback()).isTrue();
        assertThat(result.recommendationSessionId()).isNotNull();
        assertThat(result.message()).isEqualTo("Like a few homes to personalize your recommendations.");

        ArgumentCaptor<RecommendationSession> sessionCaptor =
                ArgumentCaptor.forClass(RecommendationSession.class);
        verify(recommendationSessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getInitiallyFavoritedListingIds()).isEmpty();
    }

    @Test
    void recommendedListings_shouldSnapshotFavoritesWhenCreatingSession() {
        Listing favoriteListing = listing(5L, "15213", "250000", 3, 2.0, 1500, 75);
        Listing recommendedListing = listing(7L, "15213", "260000", 3, 2.0, 1550, 80);
        ListingDTO dto = ListingDTO.builder().id(7L).build();

        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(favorite(favoriteListing)));
        when(recommendationSessionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(listingRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(recommendedListing), PageRequest.of(0, 12), 1));
        when(listingMapper.toDTO(recommendedListing)).thenReturn(dto);

        ListingPageResponse result = recommendationService.getRecommendedListings(
                1L,
                emptyFilter(),
                PageRequest.of(0, 12),
                null
        );

        assertThat(result.usingRecommendationFallback()).isFalse();
        assertThat(result.content()).containsExactly(dto);

        ArgumentCaptor<RecommendationSession> sessionCaptor =
                ArgumentCaptor.forClass(RecommendationSession.class);
        verify(recommendationSessionRepository).save(sessionCaptor.capture());
        RecommendationSession session = sessionCaptor.getValue();
        assertThat(session.getInitiallyFavoritedListingIds()).containsExactly(5L);
        assertThat(session.getFavoriteZipCodes()).containsExactly("15213");
        assertThat(session.getAvgPrice()).isEqualByComparingTo("250000.00");
        assertThat(session.getAvgBeds()).isEqualTo(3.0);
    }

    @Test
    void recommendedListings_shouldReuseUnexpiredSessionForSameUser() {
        UUID sessionId = UUID.randomUUID();
        RecommendationSession session = RecommendationSession.builder()
                .id(sessionId)
                .userId(1L)
                .avgPrice(new BigDecimal("250000"))
                .avgBeds(3.0)
                .avgBaths(2.0)
                .avgSqft(1500.0)
                .avgEnergyStarScore(75.0)
                .favoriteZipCodes(Set.of("15213"))
                .initiallyFavoritedListingIds(Set.of(5L))
                .createdAt(Instant.parse("2026-04-25T11:55:00Z"))
                .expiresAt(Instant.parse("2026-04-25T12:40:00Z"))
                .build();

        when(recommendationSessionRepository.findByIdAndUserId(sessionId, 1L))
                .thenReturn(Optional.of(session));
        when(listingRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(1, 12), 0));

        ListingPageResponse result = recommendationService.getRecommendedListings(
                1L,
                emptyFilter(),
                PageRequest.of(1, 12),
                sessionId
        );

        assertThat(result.recommendationSessionId()).isEqualTo(sessionId);
        verify(recommendationSessionRepository).findByIdAndUserId(sessionId, 1L);
    }

    private ListingFilter emptyFilter() {
        return new ListingFilter(null, null, null, null, null, null, null, null);
    }

    private Favorite favorite(Listing listing) {
        return Favorite.builder()
                .id(1L)
                .user(User.builder().id(1L).supabaseUserId("user-sub").build())
                .listing(listing)
                .build();
    }

    private Listing listing(
            Long id,
            String zipCode,
            String price,
            Integer beds,
            Double baths,
            Integer sqft,
            Integer energyStarScore
    ) {
        return Listing.builder()
                .id(id)
                .address(id + " Main St")
                .zipCode(zipCode)
                .price(new BigDecimal(price))
                .beds(beds)
                .baths(baths)
                .sqft(sqft)
                .energyStarScore(energyStarScore)
                .build();
    }
}
