package com.propertystack.homematch.recommendation;

import java.math.BigDecimal;
import java.util.Set;

public record UserPreferenceProfile(
        BigDecimal avgPrice,
        Double avgBeds,
        Double avgBaths,
        Double avgSqft,
        Double avgEnergyStarScore,
        Set<String> favoriteZipCodes,
        Set<Long> initiallyFavoritedListingIds
) {
}
