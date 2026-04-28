package com.propertystack.homematch.listing.mapper;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.dto.ListingDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class ListingMapperImpl implements ListingMapper {

    @Override
    public ListingDTO toDTO(Listing listing) {
        if (listing == null) {
            return null;
        }

        ListingDTO.ListingDTOBuilder builder = ListingDTO.builder()
                .id(listing.getId())
                .address(listing.getAddress())
                .zipCode(listing.getZipCode())
                .price(listing.getPrice())
                .sqft(listing.getSqft())
                .beds(listing.getBeds())
                .baths(listing.getBaths())
                .energyStarScore(listing.getEnergyStarScore())
                .listingUrl(listing.getListingUrl());

        if (listing.getPhotoUrls() != null) {
            builder.photoUrls(new ArrayList<>(listing.getPhotoUrls()));
        }

        return builder.build();
    }
}
