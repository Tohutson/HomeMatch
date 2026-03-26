package com.propertystack.homematch.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import static org.mockito.ArgumentMatchers.any;

// @WebMvcTest(PropertyController.class)
class ListingControllerTest {
/*
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListingService propertyService;

    @Test
    void getProperties_returnsPaginatedResults() throws Exception {

        // --- Arrange ---
        ListingDTO dto1 = ListingDTO.builder()
                .id(1L)
                .address("123 Main St")
                .zipCode("15213")
                .price(250000.0)
                .bedrooms(3)
                .bathrooms(2.5)
                .squareFootage(1800)
                .yearBuilt(1995)
                .energyRating('B')
                .build();

        ListingDTO dto2 = ListingDTO.builder()
                .id(2L)
                .address("170 Pine Ct")
                .zipCode("15210")
                .price(350000.0)
                .bedrooms(5)
                .bathrooms(2.5)
                .squareFootage(2500)
                .yearBuilt(2004)
                .energyRating('A')
                .build();

        List<ListingDTO> properties = List.of(dto1, dto2);

        Page<ListingDTO> page = new PageImpl<>(
                properties,
                PageRequest.of(0, 20),
                2
        );

        when(propertyService.getProperties(any(Pageable.class)))
                .thenReturn(page);

        // --- Act + Assert ---
        mockMvc.perform(get("/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.number").value(0));
    }*/
}