package com.propertystack.homematch.Listing;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;

    public ListingController(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @GetMapping
    public List<Listing> getListings(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minBeds,
            @RequestParam(required = false) BigDecimal minBaths) {
        int boundedLimit = Math.min(Math.max(limit, 1), 200);

        return listingRepository.findWithFilters(
            maxPrice,
            minBeds,
            minBaths,
            PageRequest.of(0, boundedLimit, Sort.by(Sort.Direction.ASC, "price")));
    }

    @GetMapping("/api/listings/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable Long id) {
        return listingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}