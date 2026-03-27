package com.propertystack.homematch.Listing;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public List<ListingDTO> getListings(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minBeds,
            @RequestParam(required = false) BigDecimal minBaths,
            @RequestParam(required = false) Integer minSqft) {
        ListingFilter filter = new ListingFilter(minPrice, maxPrice, minBeds, minBaths, minSqft);
        return listingService.getListings(limit, filter);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingDTO> getListingById(@PathVariable Long id) {
        return listingService.getListingById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}