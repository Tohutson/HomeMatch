package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.listing.query.ListingSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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

    public ListingDTO getListingById(Long id) {
        return listingRepository.findById(id)
                .map(listingMapper::toDTO)
                .orElseThrow(() -> new ListingNotFoundException(id));
    }
}
