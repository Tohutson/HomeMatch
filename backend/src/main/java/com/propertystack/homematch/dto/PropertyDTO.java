package com.propertystack.homematch.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PropertyDTO {
    private Long id;
    private String address;
    private String zipCode;
    private Double price;
    private int bedrooms;
    private double bathrooms;
    private int squareFootage;
    private int yearBuilt;
    private char energyRating;
}