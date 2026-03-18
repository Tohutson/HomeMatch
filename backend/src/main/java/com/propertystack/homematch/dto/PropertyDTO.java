package com.propertystack.homematch.dto;

public record PropertyDTO(
    Long id,
    String address,
    String zipCode,
    Double price,
    int bedrooms,
    int bathrooms,
    int squareFootage,
    int yearBuilt,
    char energyRating
) {}
