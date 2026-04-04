package com.propertystack.homematch.favorite.dto;

import com.propertystack.homematch.listing.dto.ListingDTO;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class FavoriteDTO {
    Long id;
    Long userId;
    ListingDTO listing;
    LocalDateTime createdAt;
}
