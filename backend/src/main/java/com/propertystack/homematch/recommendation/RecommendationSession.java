package com.propertystack.homematch.recommendation;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "recommendation_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RecommendationSession {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "avg_price", precision = 12, scale = 2)
    private BigDecimal avgPrice;

    @Column(name = "avg_beds")
    private Double avgBeds;

    @Column(name = "avg_baths")
    private Double avgBaths;

    @Column(name = "avg_sqft")
    private Double avgSqft;

    @Column(name = "avg_energy_star_score")
    private Double avgEnergyStarScore;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "recommendation_session_zip_codes",
            joinColumns = @JoinColumn(name = "recommendation_session_id")
    )
    @Column(name = "zip_code", nullable = false, length = 5)
    @Builder.Default
    private Set<String> favoriteZipCodes = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "recommendation_session_listing_ids",
            joinColumns = @JoinColumn(name = "recommendation_session_id")
    )
    @Column(name = "listing_id", nullable = false)
    @Builder.Default
    private Set<Long> initiallyFavoritedListingIds = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }

    public boolean isFallback() {
        return initiallyFavoritedListingIds.isEmpty();
    }
}
