package com.propertystack.homematch.listing.dto;

import com.propertystack.homematch.listing.query.ListingFilter;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.UUID;

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
    private Integer maxSqft;

    @Min(0)
    private Integer minEnergyStarScore;

    @Size(max = 100)
    private String location;

    private SortOption sortOption;

    private UUID recommendationSessionId;

    public ListingFilter toFilter() {
        return new ListingFilter(
                location,
                minPrice,
                maxPrice,
                minBeds,
                minBaths,
                minSqft,
                maxSqft,
                minEnergyStarScore
        );
    }

    public PageRequest toPageable() {
        Sort sort = (sortOption != null)
                ? sortOption.toSort()
                : Sort.by(Sort.Direction.ASC, "price"); // default

        return PageRequest.of(page, size, sort);
    }

    public boolean isRecommendedSort() {
        return sortOption == SortOption.RECOMMENDED;
    }

    @AssertTrue(message = "minPrice must be <= maxPrice")
    public boolean isValidPriceRange() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }

    @AssertTrue(message = "minSqft must be <= maxSqft")
    public boolean isValidSqftRange() {
        return minSqft == null || maxSqft == null || minSqft <= maxSqft;
    }
}
