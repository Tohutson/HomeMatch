package com.propertystack.homematch.listing.mapper;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.dto.ListingDTO;
import org.springframework.stereotype.Component;

@Component
public class ListingMapper {

    public ListingDTO toDTO(Listing listing) {
        if (listing == null) {
            return null;
        }

        return ListingDTO.builder()
                .id(listing.getId())
                .address(listing.getAddress())
                .zipCode(listing.getZipCode())
                .price(listing.getPrice())
                .sqft(listing.getSqft())
                .beds(listing.getBeds())
                .baths(listing.getBaths())
                .energyStarScore(listing.getEnergyStarScore())
                .listingUrl(listing.getListingUrl())
                .photoUrls(listing.getPhotoUrls())
                .build();
    }
}
