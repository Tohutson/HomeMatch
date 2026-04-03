package com.propertystack.homematch.listing.dto;

import com.propertystack.homematch.listing.query.ListingFilter;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;

@Getter
@Setter
public class ListingSearchRequest {

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 20;

    @DecimalMin(value = "0.0")
    private BigDecimal minPrice;

    @DecimalMin(value = "0.0")
    private BigDecimal maxPrice;

    @Min(0)
    private Integer minBeds;

    @DecimalMin(value = "0.0")
    private Double minBaths;

    @Min(0)
    private Integer minSqft;

    @Min(0)
    private Integer minEnergyStar;

    public ListingFilter toFilter() {
        return new ListingFilter(minPrice, maxPrice, minBeds, minBaths, minSqft, minEnergyStar);
    }

    public PageRequest toPageable() {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "price"));
    }

    @AssertTrue(message = "minPrice must be <= maxPrice")
    public boolean isValidPriceRange() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }
}