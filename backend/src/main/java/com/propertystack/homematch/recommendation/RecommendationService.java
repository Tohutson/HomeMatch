package com.propertystack.homematch.recommendation;

import com.propertystack.homematch.favorite.Favorite;
import com.propertystack.homematch.favorite.FavoriteRepository;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingPageResponse;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.listing.query.ListingSpecification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Duration SESSION_DURATION = Duration.ofMinutes(45);

    private final RecommendationSessionRepository recommendationSessionRepository;
    private final FavoriteRepository favoriteRepository;
    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;
    private final Clock clock;

    public RecommendationService(
            RecommendationSessionRepository recommendationSessionRepository,
            FavoriteRepository favoriteRepository,
            ListingRepository listingRepository,
            ListingMapper listingMapper,
            Clock clock
    ) {
        this.recommendationSessionRepository = recommendationSessionRepository;
        this.favoriteRepository = favoriteRepository;
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
        this.clock = clock;
    }

    @Transactional
    public ListingPageResponse getRecommendedListings(
            Long userId,
            ListingFilter filter,
            Pageable pageable,
            UUID recommendationSessionId
    ) {
        RecommendationSession session = resolveSession(userId, recommendationSessionId);
        Pageable recommendationPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.unsorted()
        );

        Page<ListingDTO> page = session.isFallback()
                ? fallbackListings(filter, recommendationPageable)
                : recommendedListings(session, filter, recommendationPageable);

        return ListingPageResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .recommendationSessionId(session.getId())
                .usingRecommendationFallback(session.isFallback())
                .message(session.isFallback()
                        ? "Like a few homes to personalize your recommendations."
                        : null)
                .build();
    }

    private RecommendationSession resolveSession(Long userId, UUID sessionId) {
        Instant now = clock.instant();

        if (sessionId != null) {
            return recommendationSessionRepository.findByIdAndUserId(sessionId, userId)
                    .filter(session -> !session.isExpired(now))
                    .orElseGet(() -> createSession(userId, now));
        }

        return createSession(userId, now);
    }

    private RecommendationSession createSession(Long userId, Instant now) {
        UserPreferenceProfile profile = buildProfile(userId);

        RecommendationSession session = RecommendationSession.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .avgPrice(profile.avgPrice())
                .avgBeds(profile.avgBeds())
                .avgBaths(profile.avgBaths())
                .avgSqft(profile.avgSqft())
                .avgEnergyStarScore(profile.avgEnergyStarScore())
                .favoriteZipCodes(profile.favoriteZipCodes())
                .initiallyFavoritedListingIds(profile.initiallyFavoritedListingIds())
                .createdAt(now)
                .expiresAt(now.plus(SESSION_DURATION))
                .build();

        return recommendationSessionRepository.save(session);
    }

    private UserPreferenceProfile buildProfile(Long userId) {
        List<Listing> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(Favorite::getListing)
                .toList();

        Set<Long> listingIds = favorites.stream()
                .map(Listing::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> zipCodes = favorites.stream()
                .map(Listing::getZipCode)
                .filter(zip -> zip != null && !zip.isBlank())
                .collect(Collectors.toSet());

        return new UserPreferenceProfile(
                averagePrice(favorites),
                averageDouble(favorites.stream().map(Listing::getBeds).filter(Objects::nonNull).map(Number::doubleValue).toList()),
                averageDouble(favorites.stream().map(Listing::getBaths).filter(Objects::nonNull).toList()),
                averageDouble(favorites.stream().map(Listing::getSqft).filter(Objects::nonNull).map(Number::doubleValue).toList()),
                averageDouble(favorites.stream().map(Listing::getEnergyStarScore).filter(Objects::nonNull).map(Number::doubleValue).toList()),
                zipCodes,
                listingIds
        );
    }

    private BigDecimal averagePrice(List<Listing> listings) {
        List<BigDecimal> prices = listings.stream()
                .map(Listing::getPrice)
                .filter(Objects::nonNull)
                .toList();

        if (prices.isEmpty()) {
            return null;
        }

        BigDecimal total = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP);
    }

    private Double averageDouble(List<Double> values) {
        return values.isEmpty()
                ? null
                : values.stream().mapToDouble(Double::doubleValue).average().orElseThrow();
    }

    private Page<ListingDTO> fallbackListings(ListingFilter filter, Pageable pageable) {
        Pageable fallbackPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "id")
        );

        return listingRepository.findAll(ListingSpecification.fromFilter(filter), fallbackPageable)
                .map(listingMapper::toDTO);
    }

    private Page<ListingDTO> recommendedListings(
            RecommendationSession session,
            ListingFilter filter,
            Pageable pageable
    ) {
        Specification<Listing> specification = Specification
                .where(ListingSpecification.fromFilter(filter))
                .and(excludeInitiallyFavorited(session.getInitiallyFavoritedListingIds()))
                .and(orderByRecommendationScore(session));

        return listingRepository.findAll(specification, pageable)
                .map(listingMapper::toDTO);
    }

    private Specification<Listing> excludeInitiallyFavorited(Set<Long> listingIds) {
        return (root, query, cb) -> {
            if (listingIds == null || listingIds.isEmpty()) {
                return null;
            }

            return cb.not(root.get("id").in(listingIds));
        };
    }

    private Specification<Listing> orderByRecommendationScore(RecommendationSession session) {
        return (root, query, cb) -> {
            if (Long.class.equals(query.getResultType()) || long.class.equals(query.getResultType())) {
                return null;
            }

            Expression<Double> score = scoreExpression(root, cb, session);
            query.orderBy(cb.desc(score), cb.asc(root.get("id")));
            return null;
        };
    }

    private Expression<Double> scoreExpression(
            Root<Listing> root,
            CriteriaBuilder cb,
            RecommendationSession session
    ) {
        Expression<Double> score = cb.literal(0.0);
        score = cb.sum(score, similarity(
                root,
                cb,
                "price",
                session.getAvgPrice() == null ? null : session.getAvgPrice().doubleValue(),
                0.35
        ));
        score = cb.sum(score, similarity(root, cb, "beds", session.getAvgBeds(), 0.20));
        score = cb.sum(score, similarity(root, cb, "baths", session.getAvgBaths(), 0.15));
        score = cb.sum(score, similarity(root, cb, "sqft", session.getAvgSqft(), 0.15));
        score = cb.sum(score, similarity(root, cb, "energyStarScore", session.getAvgEnergyStarScore(), 0.05));

        if (!session.getFavoriteZipCodes().isEmpty()) {
            Expression<Double> zipScore = cb.<Double>selectCase()
                    .when(root.get("zipCode").in(session.getFavoriteZipCodes()), 0.10)
                    .otherwise(0.0);
            score = cb.sum(score, zipScore);
        }

        return score;
    }

    private Expression<Double> similarity(
            Root<Listing> root,
            CriteriaBuilder cb,
            String property,
            Double average,
            double weight
    ) {
        if (average == null) {
            return cb.literal(0.0);
        }

        double denominator = Math.max(Math.abs(average), 1.0);
        Expression<Double> value = cb.coalesce(root.get(property).as(Double.class), average);
        Expression<Double> normalizedDistance = cb.quot(
                cb.abs(cb.diff(value, average)),
                denominator
        ).as(Double.class);

        return cb.prod(normalizedDistance, -weight);
    }
}
