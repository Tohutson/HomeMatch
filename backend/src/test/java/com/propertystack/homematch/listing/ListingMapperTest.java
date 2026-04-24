package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.mapper.ListingMapperImpl;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
class ListingMapperTest {

    private final ListingMapper mapper = new ListingMapperImpl();

    @Test
    void shouldMapListingToDTO() {
        Listing listing = Listing.builder()
                .id(1L)
                .address("30 Pitt St")
                .zipCode("12345")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .energyStarScore(75)
                .listingUrl("http://example.com")
                .build();

        ListingDTO dto = mapper.toDTO(listing);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getAddress()).isEqualTo("30 Pitt St");
        assertThat(dto.getZipCode()).isEqualTo("12345");
        assertThat(dto.getPrice()).isEqualByComparingTo("250000");
        assertThat(dto.getSqft()).isEqualTo(2250);
        assertThat(dto.getBeds()).isEqualTo(3);
        assertThat(dto.getBaths()).isEqualTo(1.5);
        assertThat(dto.getEnergyStarScore()).isEqualTo(75);
        assertThat(dto.getListingUrl()).isEqualTo("http://example.com");
    }
}
