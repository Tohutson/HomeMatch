package com.propertystack.homematch.listing.query;

import com.propertystack.homematch.listing.Listing;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ListingSpecification {

    public static Specification<Listing> fromFilter(ListingFilter filter) {
        return Specification
                .where(minPrice(filter.minPrice()))
                .and(maxPrice(filter.maxPrice()))
                .and(minBeds(filter.minBeds()))
                .and(minBaths(filter.minBaths()))
                .and(minSqft(filter.minSqft()))
                .and(minEnergyStarScore(filter.minEnergyStarScore()));
    }

    private static Specification<Listing> minPrice(BigDecimal minPrice) {
        return (root, query, cb) -> minPrice == null ? null : cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    private static Specification<Listing> maxPrice(BigDecimal maxPrice) {
        return (root, query, cb) -> maxPrice == null ? null : cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    private static Specification<Listing> minBeds(Integer minBeds) {
        return (root, query, cb) -> minBeds == null ? null : cb.greaterThanOrEqualTo(root.get("beds"), minBeds);
    }

    private static Specification<Listing> minBaths(Double minBaths) {
        return (root, query, cb) -> minBaths == null ? null : cb.greaterThanOrEqualTo(root.get("baths"), minBaths);
    }

    private static Specification<Listing> minSqft(Integer minSqft) {
        return (root, query, cb) -> minSqft == null ? null : cb.greaterThanOrEqualTo(root.get("sqft"), minSqft);
    }

    private static Specification<Listing> minEnergyStarScore(Integer minEnergyStarScore) {
        return (root, query, cb) -> minEnergyStarScore == null ? null
                : cb.greaterThanOrEqualTo(root.get("energyStarScore"), minEnergyStarScore);
    }
}
