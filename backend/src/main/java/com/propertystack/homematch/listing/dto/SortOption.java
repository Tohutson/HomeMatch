package com.propertystack.homematch.listing.dto;

import org.springframework.data.domain.Sort;

public enum SortOption {
    PRICE_ASC(Sort.by(Sort.Direction.ASC, "price")),
    PRICE_DESC(Sort.by(Sort.Direction.DESC, "price")),
    SIZE_ASC(Sort.by(Sort.Direction.ASC, "sqft")),
    SIZE_DESC(Sort.by(Sort.Direction.DESC, "sqft")),
    ENERGY_ASC(Sort.by(Sort.Direction.ASC, "energyStarScore")),
    ENERGY_DESC(Sort.by(Sort.Direction.DESC, "energyStarScore"));

    private final Sort sort;

    SortOption(Sort sort) {
        this.sort = sort;
    }

    public Sort toSort() {
        return sort;
    }
}