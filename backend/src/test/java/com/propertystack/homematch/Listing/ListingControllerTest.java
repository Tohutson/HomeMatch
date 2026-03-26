package com.propertystack.homematch.Listing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ListingController.class)
class ListingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListingService listingService;

    // -------------------------------
    // GET /api/listings
    // -------------------------------

    @Test
    void shouldReturnPaginatedListings() throws Exception {
        ListingDTO dto = ListingDTO.builder()
                .id(1L)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .listingUrl("http://example.com")
                .photoUrls(List.of(
                        "url1.jpg",
                        "url2.jpg"
                ))
                .build();

        Page<ListingDTO> page = new PageImpl<>(
                List.of(dto),
                PageRequest.of(0, 20),
                1
        );

        when(listingService.getListings(any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/listings")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())

                // Page structure
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.number").value(0))

                // DTO fields
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].address").value("30 Pitt St"))
                .andExpect(jsonPath("$.content[0].price").value(250000))
                .andExpect(jsonPath("$.content[0].sqft").value(2250))
                .andExpect(jsonPath("$.content[0].beds").value(3))
                .andExpect(jsonPath("$.content[0].baths").value(1.5))

                // Photo list
                .andExpect(jsonPath("$.content[0].photoUrls").isArray())
                .andExpect(jsonPath("$.content[0].photoUrls[0]").value("url1.jpg"))
                .andExpect(jsonPath("$.content[0].photoUrls[1]").value("url2.jpg"));
    }

    @Test
    void shouldApplyFiltersCorrectly() throws Exception {
        Page<ListingDTO> emptyPage = Page.empty();

        when(listingService.getListings(any(), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/api/listings")
                        .param("minPrice", "100000")
                        .param("maxPrice", "500000")
                        .param("minBeds", "2")
                        .param("minBaths", "2")
                        .param("minSqft", "1000"))
                .andExpect(status().isOk());

        // Filter logic verified in ListingServiceTest
    }

    @Test
    void shouldReturnEmptyPageWhenNoListingsFound() throws Exception {
        when(listingService.getListings(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void shouldReturnBadRequestForInvalidPagination() throws Exception {
        mockMvc.perform(get("/api/listings")
                .param("page", "-1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/listings")
                .param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------
    // GET /api/listings{id}
    // -------------------------------

    @Test
    void shouldReturnListingById() throws Exception {
        ListingDTO dto = ListingDTO.builder()
                .id(1L)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .listingUrl("http://example.com")
                .photoUrls(List.of(
                        "url1.jpg",
                        "url2.jpg"
                ))
                .build();

        when(listingService.getListingById(1L))
                .thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/listings/1"))
                .andExpect(status().isOk())
                // DTO fields
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.address").value("30 Pitt St"))
                .andExpect(jsonPath("$.price").value(250000))
                .andExpect(jsonPath("$.sqft").value(2250))
                .andExpect(jsonPath("$.beds").value(3))
                .andExpect(jsonPath("$.baths").value(1.5))
                .andExpect(jsonPath("$.listingUrl").value("http://example.com"))
                // Photo list
                .andExpect(jsonPath("$.photoUrls").isArray())
                .andExpect(jsonPath("$.photoUrls[0]").value("url1.jpg"))
                .andExpect(jsonPath("$.photoUrls[1]").value("url2.jpg"));
    }

    @Test
    void shouldReturn404WhenListingNotFound() throws Exception {
        when(listingService.getListingById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/listings/999"))
                .andExpect(status().isNotFound());
    }
}