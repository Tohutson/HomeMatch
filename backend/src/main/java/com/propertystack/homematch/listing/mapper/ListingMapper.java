package com.propertystack.homematch.listing.mapper;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.dto.ListingDTO;

public interface ListingMapper {

    ListingDTO toDTO(Listing listing);
}
