package com.propertystack.homematch.Listing;

import java.math.BigDecimal;

public record ListingFilter (
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer minBeds,
        Double minBaths,
        Integer minSqft
) {
    public ListingFilter {
        if (minPrice != null && minPrice.signum() < 0) {
            throw new IllegalArgumentException("minPrice must be >= 0");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new IllegalArgumentException("maxPrice must be >= 0");
        }
        if (minBeds != null && minBeds < 0) {
            throw new IllegalArgumentException("minBeds must be >= 0");
        }
        if (minBaths != null && minBaths < 0) {
            throw new IllegalArgumentException("minBaths must be >= 0");
        }
        if (minSqft != null && minSqft < 0) {
            throw new IllegalArgumentException("minSqft must be >= 0");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new IllegalArgumentException("minPrice must be <= maxPrice");
        }
    }

    public boolean isEmpty() {
        return minPrice == null && maxPrice == null
                && minBeds == null && minBaths == null
                && minSqft == null;
    }
}
