package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.query.ListingFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ListingController.class)
class ListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListingService listingService;

    @Test
    void shouldReturnPaginatedListings() throws Exception {
        ListingDTO dto = listingDto();

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
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].address").value("30 Pitt St"))
                .andExpect(jsonPath("$.content[0].price").value(250000))
                .andExpect(jsonPath("$.content[0].sqft").value(2250))
                .andExpect(jsonPath("$.content[0].beds").value(3))
                .andExpect(jsonPath("$.content[0].baths").value(1.5))
                .andExpect(jsonPath("$.content[0].listingUrl").value("http://example.com"))
                .andExpect(jsonPath("$.content[0].photoUrls").isArray())
                .andExpect(jsonPath("$.content[0].photoUrls[0]").value("url1.jpg"))
                .andExpect(jsonPath("$.content[0].photoUrls[1]").value("url2.jpg"));

        verify(listingService).getListings(any(), any());
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldUseDefaultPaginationWhenParamsAreOmitted() throws Exception {
        when(listingService.getListings(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        verify(listingService).getListings(any(), pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(20);

        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldBindQueryParamsAndPassFilterAndPageableToService() throws Exception {
        when(listingService.getListings(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/listings")
                        .param("page", "1")
                        .param("size", "10")
                        .param("minPrice", "100000")
                        .param("maxPrice", "500000")
                        .param("minBeds", "2")
                        .param("minBaths", "2.5")
                        .param("minSqft", "1000"))
                .andExpect(status().isOk());

        ArgumentCaptor<ListingFilter> filterCaptor = ArgumentCaptor.forClass(ListingFilter.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        verify(listingService).getListings(filterCaptor.capture(), pageableCaptor.capture());

        ListingFilter filter = filterCaptor.getValue();
        Pageable pageable = pageableCaptor.getValue();

        assertThat(filter.minPrice()).isEqualByComparingTo("100000");
        assertThat(filter.maxPrice()).isEqualByComparingTo("500000");
        assertThat(filter.minBeds()).isEqualTo(2);
        assertThat(filter.minBaths()).isEqualTo(2.5);
        assertThat(filter.minSqft()).isEqualTo(1000);

        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(10);

        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnEmptyPageWhenNoListingsFound() throws Exception {
        when(listingService.getListings(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());

        verify(listingService).getListings(any(), any());
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnBadRequestForNegativePage() throws Exception {
        mockMvc.perform(get("/api/listings").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForSizeBelowMinimum() throws Exception {
        mockMvc.perform(get("/api/listings").param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForSizeAboveMaximum() throws Exception {
        mockMvc.perform(get("/api/listings").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForNegativeMinPrice() throws Exception {
        mockMvc.perform(get("/api/listings").param("minPrice", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForNegativeMaxPrice() throws Exception {
        mockMvc.perform(get("/api/listings").param("maxPrice", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForNegativeMinBeds() throws Exception {
        mockMvc.perform(get("/api/listings").param("minBeds", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForNegativeMinBaths() throws Exception {
        mockMvc.perform(get("/api/listings").param("minBaths", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnBadRequestForNegativeMinSqft() throws Exception {
        mockMvc.perform(get("/api/listings").param("minSqft", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnListingById() throws Exception {
        when(listingService.getListingById(1L)).thenReturn(Optional.of(listingDto()));

        mockMvc.perform(get("/api/listings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.address").value("30 Pitt St"))
                .andExpect(jsonPath("$.price").value(250000))
                .andExpect(jsonPath("$.sqft").value(2250))
                .andExpect(jsonPath("$.beds").value(3))
                .andExpect(jsonPath("$.baths").value(1.5))
                .andExpect(jsonPath("$.listingUrl").value("http://example.com"))
                .andExpect(jsonPath("$.photoUrls").isArray())
                .andExpect(jsonPath("$.photoUrls[0]").value("url1.jpg"))
                .andExpect(jsonPath("$.photoUrls[1]").value("url2.jpg"));

        verify(listingService).getListingById(1L);
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnNotFoundWhenListingDoesNotExist() throws Exception {
        when(listingService.getListingById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/listings/999"))
                .andExpect(status().isNotFound());

        verify(listingService).getListingById(999L);
        verifyNoMoreInteractions(listingService);
    }

    private ListingDTO listingDto() {
        return ListingDTO.builder()
                .id(1L)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .listingUrl("http://example.com")
                .photoUrls(List.of("url1.jpg", "url2.jpg"))
                .build();
    }
}