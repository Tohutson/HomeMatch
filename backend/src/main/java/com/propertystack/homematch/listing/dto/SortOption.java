package com.propertystack.homematch.listing.dto;

import org.springframework.data.domain.Sort;

public enum SortOption {
    PRICE_ASC(Sort.by(Sort.Direction.ASC, "price")),
    PRICE_DESC(Sort.by(Sort.Direction.DESC, "price")),
    BEDS_ASC(Sort.by(Sort.Direction.ASC, "beds")),
    BEDS_DESC(Sort.by(Sort.Direction.DESC, "beds")),
    SQFT_ASC(Sort.by(Sort.Direction.ASC, "sqft")),
    SQFT_DESC(Sort.by(Sort.Direction.DESC, "sqft")),
    ENERGY_DESC(Sort.by(Sort.Direction.DESC, "energyStarScore")),
    RECOMMENDED(Sort.by(Sort.Direction.ASC, "id"));

    private final Sort sort;

    SortOption(Sort sort) {
        this.sort = sort;
    }

    public Sort toSort() {
        return sort;
    }
}
