package com.propertystack.homematch.Listing;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ListingDTO {

    Long id;
    String address;
    BigDecimal price;
    Integer sqft;
    Integer beds;
    Double baths;

    String listingUrl;

    List<String> photoUrls;
}