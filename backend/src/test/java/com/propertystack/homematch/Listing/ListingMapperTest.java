package com.propertystack.homematch.Listing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

@ExtendWith(MockitoExtension.class)
class ListingMapperTest {

    private final ListingMapper mapper = Mappers.getMapper(ListingMapper.class);

    @Test
    void shouldMapListingToDTO() {
        Listing listing = Listing.builder()
                .id(1L)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(new BigDecimal("1.5"))
                .listingUrl("http://example.com")
                .build();

        ListingDTO dto = mapper.toDTO(listing);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getAddress()).isEqualTo("30 Pitt St");
        assertThat(dto.getPrice()).isEqualByComparingTo("250000");
        assertThat(dto.getBeds()).isEqualTo(3);
        assertThat(dto.getBaths()).isEqualTo(1.5);
        assertThat(dto.getSqft()).isEqualTo(2250);
    }
}
