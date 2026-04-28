package com.propertystack.homematch.favorite.dto;

import jakarta.validation.constraints.Min;

public record CreateFavoriteRequest(
        @Min(1) Long listingId
) {}
