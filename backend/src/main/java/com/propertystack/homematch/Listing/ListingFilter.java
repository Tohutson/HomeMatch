package com.propertystack.homematch.Listing;

import java.math.BigDecimal;

public record ListingFilter (
    BigDecimal minPrice,
    BigDecimal maxPrice,
    Integer minBeds,
    BigDecimal  minBaths,
    Integer minSqft
) {

    public boolean isEmpty() {
        return minPrice == null && maxPrice == null
                && minBeds == null && minBaths == null
                && minSqft == null;
    }
}
