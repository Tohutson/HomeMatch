package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingPageResponse;
import com.propertystack.homematch.listing.dto.ListingSearchRequest;
import com.propertystack.homematch.search.SearchSuggestionDTO;
import com.propertystack.homematch.search.SuggestionService;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@Validated
public class ListingController {

    private final ListingService listingService;
    private final SuggestionService suggestionService;
    private final UserService userService;

    public ListingController(
            ListingService listingService,
            SuggestionService suggestionService,
            UserService userService
    ) {
        this.listingService = listingService;
        this.suggestionService = suggestionService;
        this.userService = userService;
    }

    @GetMapping
    public ListingPageResponse getListings(
            @Valid @ModelAttribute ListingSearchRequest request,
            Authentication authentication
    ) {
        if (request.isRecommendedSort()) {
            Jwt jwt = jwtFrom(authentication);
            if (jwt == null) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Recommended listings require authentication"
                );
            }

            User user = userService.getOrCreateUser(jwt);
            return listingService.getRecommendedListings(
                    user.getId(),
                    request.toFilter(),
                    request.toPageable(),
                    request.getRecommendationSessionId()
            );
        }

        return listingService.getListings(
                request.toFilter(),
                request.toPageable()
        );
    }

    private Jwt jwtFrom(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }

        return jwt;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingDTO> getListingById(@PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }

    @GetMapping("/availability")
    public List<Long> getAvailableListingIds(
            @RequestParam @Size(max = 200) List<@Min(1) Long> ids
    ) {
        return listingService.getAvailableListingIds(ids);
    }

    @GetMapping("/suggestions")
    public List<SearchSuggestionDTO> getSuggestions(
            @RequestParam @Size(min = 1, max = 100) String q,
            @RequestParam(defaultValue = "5") @Min(1) @Max(10) int limit
    ) {
        return suggestionService.getSuggestions(q, limit);
    }
}
