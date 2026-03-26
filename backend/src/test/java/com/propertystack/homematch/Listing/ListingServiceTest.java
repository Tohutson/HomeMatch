package com.propertystack.homematch.Listing;

import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

 /*   @Mock
    private PropertyRepository repository;

    @InjectMocks
    private ListingService service;

    @Test
    void getProperties_returnsMappedDTOs() {

        // --- Arrange ---
        Property property1 = Property.builder()
                .id(1L)
                .address("123 Main St")
                .zipCode("15213")
                .price(250000.0)
                .bedrooms(3)
                .bathrooms(2.5)
                .squareFootage(1800)
                .yearBuilt(1995)
                .energyRating('C')
                .createdAt(LocalDateTime.now())
                .build();

        Property property2 = Property.builder()
                .id(2L)
                .address("170 Pine Ct")
                .zipCode("15210")
                .price(350000.0)
                .bedrooms(5)
                .bathrooms(2.5)
                .squareFootage(2500)
                .yearBuilt(2004)
                .energyRating('A')
                .createdAt(LocalDateTime.now())
                .build();

        List<Property> properties = List.of(property1, property2);

        Page<Property> page = new PageImpl<>(
                properties,
                PageRequest.of(0, 20),
                2
        );

        when(repository.findAll(any(Pageable.class)))
                .thenReturn(page);

        // --- Act ---
        Page<ListingDTO> result = service.getProperties(PageRequest.of(0, 20));

        // --- Assert ---
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.getSize()).isEqualTo(20);
        assertThat(result.getNumber()).isEqualTo(0);

        ListingDTO dto1 = result.getContent().get(0);
        assertThat(dto1.getId()).isEqualTo(1L);
        assertThat(dto1.getAddress()).isEqualTo("123 Main St");
        assertThat(dto1.getZipCode()).isEqualTo("15213");
        assertThat(dto1.getPrice()).isEqualTo(250000.0);
        assertThat(dto1.getBedrooms()).isEqualTo(3);
        assertThat(dto1.getBathrooms()).isEqualTo(2.5);
        assertThat(dto1.getSquareFootage()).isEqualTo(1800);
        assertThat(dto1.getYearBuilt()).isEqualTo(1995);
        assertThat(dto1.getEnergyRating()).isEqualTo('C');
    }*/
}
