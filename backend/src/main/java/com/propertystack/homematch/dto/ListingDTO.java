package com.propertystack.homematch.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ListingDTO {

    Long id;
    String address;
    BigDecimal price;
    BigDecimal sqft;
    Integer beds;
    BigDecimal baths;

    String listingUrl;

    String photo1;
    String photo2;
    String photo3;
    String photo4;
    String photo5;

    String allPhotoUrls;
}