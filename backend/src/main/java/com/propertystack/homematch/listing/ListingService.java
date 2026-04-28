package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.dto.ListingPageResponse;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.listing.query.ListingSpecification;
import com.propertystack.homematch.recommendation.RecommendationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;
    private final RecommendationService recommendationService;

    public ListingService(
            ListingRepository listingRepository,
            ListingMapper listingMapper,
            RecommendationService recommendationService
    ) {
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
        this.recommendationService = recommendationService;
    }

    public ListingPageResponse getListings(ListingFilter filter, Pageable pageable) {
        Page<ListingDTO> page = listingRepository.findAll(
                ListingSpecification.fromFilter(filter), pageable)
                .map(listingMapper::toDTO);

        return toResponse(page);
    }

    public ListingPageResponse getRecommendedListings(
            Long userId,
            ListingFilter filter,
            Pageable pageable,
            UUID recommendationSessionId
    ) {
        return recommendationService.getRecommendedListings(userId, filter, pageable, recommendationSessionId);
    }

    public ListingDTO getListingById(Long id) {
        return listingRepository.findById(id)
                .map(listingMapper::toDTO)
                .orElseThrow(() -> new ListingNotFoundException(id));
    }

    public List<Long> getAvailableListingIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }

        return listingRepository.findExistingIdsByIdIn(ids);
    }

    private ListingPageResponse toResponse(Page<ListingDTO> page) {
        return ListingPageResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
