package com.propertystack.homematch.listing.mapper;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.dto.ListingDTO;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper (componentModel = "spring")
public interface ListingMapper {

    ListingMapper INSTANCE = Mappers.getMapper(ListingMapper.class);

    ListingDTO toDTO(Listing listing);
}