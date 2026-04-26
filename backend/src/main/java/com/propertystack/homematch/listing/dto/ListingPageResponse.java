package com.propertystack.homematch.listing.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record ListingPageResponse(
        List<ListingDTO> content,
        int page,
        int number,
        int size,
        long totalElements,
        int totalPages,
        UUID recommendationSessionId,
        boolean usingRecommendationFallback,
        String message
) {
}
