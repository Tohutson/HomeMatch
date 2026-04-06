package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingSearchRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings")
@Validated
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public Page<ListingDTO> getListings(@Valid @ModelAttribute ListingSearchRequest request) {
        return listingService.getListings(
                request.toFilter(),
                request.toPageable()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingDTO> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }
}