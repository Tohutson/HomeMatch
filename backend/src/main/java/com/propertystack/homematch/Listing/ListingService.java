package com.propertystack.homematch.Listing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public ListingService(ListingRepository listingRepository, ListingMapper listingMapper) {
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
    }

    public Page<ListingDTO> getListings(ListingFilter filter, Pageable pageable) {
        return listingRepository.findAll(
                ListingSpecification.fromFilter(filter), pageable)
                .map(listingMapper::toDTO);
    }

    public Optional<ListingDTO> getListingById(Long id) {
        return listingRepository.findById(id)
                .map(listingMapper::toDTO);
    }

}
