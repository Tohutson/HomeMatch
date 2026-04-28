package com.propertystack.homematch.listing.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ListingDTO {
    Long id;
    String address;
    String zipCode;
    BigDecimal price;
    Integer sqft;
    Integer beds;
    Double baths;
    Integer energyStarScore;
    String listingUrl;

    List<String> photoUrls;


}