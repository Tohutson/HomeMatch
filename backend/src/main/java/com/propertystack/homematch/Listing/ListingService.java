package com.propertystack.homematch.Listing;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public ListingService(ListingRepository listingRepository, ListingMapper listingMapper) {
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
    }

    public List<ListingDTO> getListings(int limit, ListingFilter filter) {
        int boundedLimit = Math.min(Math.max(limit, 1), 200);
        var pageable = PageRequest.of(0, boundedLimit, Sort.by(Sort.Direction.ASC, "price"));

        if (filter.isEmpty()) {
            return listingRepository.findAll(pageable)
                .stream()
                .map(listingMapper::toDTO)
                .toList();
        }

        return listingRepository.findAll(ListingSpecification.fromFilter(filter), pageable)
                .getContent()
                .stream()
                .map(listingMapper::toDTO)
                .toList();
    }

    public Optional<ListingDTO> getListingById(Long id) {
        return listingRepository.findById(id)
                .map(listingMapper::toDTO);
    }

}
