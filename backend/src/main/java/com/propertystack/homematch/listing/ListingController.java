package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingSearchRequest;
import com.propertystack.homematch.search.SearchSuggestionDTO;
import com.propertystack.homematch.search.SuggestionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@Validated
public class ListingController {

    private final ListingService listingService;
    private final SuggestionService suggestionService;

    public ListingController(ListingService listingService,  SuggestionService suggestionService) {
        this.listingService = listingService;
        this.suggestionService = suggestionService;
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

    @GetMapping("/suggestions")
    public List<SearchSuggestionDTO> getSuggestions(@RequestParam String q, @RequestParam(defaultValue = "5") int limit) {
        return suggestionService.getSuggestions(q, limit);
    }
}