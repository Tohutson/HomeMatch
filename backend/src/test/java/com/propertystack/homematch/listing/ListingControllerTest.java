package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.search.SearchSuggestionDTO;
import com.propertystack.homematch.search.SuggestionService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.data.domain.Sort.Direction.ASC;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = ListingController.class,
        excludeAutoConfiguration = OAuth2ResourceServerAutoConfiguration.class
)
@ActiveProfiles("test")
class ListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListingService listingService;

    @MockitoBean
    private SuggestionService suggestionService;

    @Test
    void shouldReturnPaginatedListings() throws Exception {
        ListingDTO dto = listingDto();

        Page<ListingDTO> page = new PageImpl<>(
                List.of(dto),
                Pageable.ofSize(20).withPage(0),
                1);

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
                .andExpect(jsonPath("$.content[0].energyStarScore").value(75))
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

        assertThat(pageable.getSort().getOrderFor("price")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("price").isAscending()).isTrue();

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
                .param("minSqft", "1000")
                .param("maxSqft", "2500")
                .param("minEnergyStarScore", "50")
                .param("sortOption", "PRICE_DESC"))
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
        assertThat(filter.maxSqft()).isEqualTo(2500);
        assertThat(filter.minEnergyStarScore()).isEqualTo(50);

        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(10);

        assertThat(pageable.getSort().getOrderFor("price").isDescending()).isTrue();

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
    void shouldReturnBadRequestForNegativeMinEnergyStarScore() throws Exception {
        mockMvc.perform(get("/api/listings").param("minEnergyStarScore", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnListingById() throws Exception {
        when(listingService.getListingById(1L)).thenReturn(listingDto());

        mockMvc.perform(get("/api/listings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.address").value("30 Pitt St"))
                .andExpect(jsonPath("$.price").value(250000))
                .andExpect(jsonPath("$.sqft").value(2250))
                .andExpect(jsonPath("$.beds").value(3))
                .andExpect(jsonPath("$.baths").value(1.5))
                .andExpect(jsonPath("$.energyStarScore").value(75))
                .andExpect(jsonPath("$.listingUrl").value("http://example.com"))
                .andExpect(jsonPath("$.photoUrls").isArray())
                .andExpect(jsonPath("$.photoUrls[0]").value("url1.jpg"))
                .andExpect(jsonPath("$.photoUrls[1]").value("url2.jpg"));

        verify(listingService).getListingById(1L);
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnAvailableListingIds() throws Exception {
        when(listingService.getAvailableListingIds(List.of(1L, 2L, 99L)))
                .thenReturn(List.of(1L, 2L));

        mockMvc.perform(get("/api/listings/availability")
                        .param("ids", "1", "2", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value(1))
                .andExpect(jsonPath("$[1]").value(2));

        verify(listingService).getAvailableListingIds(List.of(1L, 2L, 99L));
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnNotFoundWhenListingDoesNotExist() throws Exception {
        when(listingService.getListingById(999L))
                .thenThrow(new ListingNotFoundException(999L));

        mockMvc.perform(get("/api/listings/999"))
                .andExpect(status().isNotFound());

        verify(listingService).getListingById(999L);
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldBindSortOptionAndPassSortedPageableToService() throws Exception {
        when(listingService.getListings(any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/listings")
                .param("page", "0")
                .param("size", "20")
                .param("sortOption", "PRICE_DESC"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        verify(listingService).getListings(any(), pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();

        assertThat(pageable.getSort().getOrderFor("price")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("price").isDescending()).isTrue();
    }

    @Test
    void shouldBindLocationAndPassFilterAndDefaultPageableToService() throws Exception {
        ListingDTO dto = listingDto();
        Page<ListingDTO> page = new PageImpl<>(
                List.of(dto),
                PageRequest.of(0, 20, Sort.by(ASC, "price")),
                1
        );

        given(listingService.getListings(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .willReturn(page);

        mockMvc.perform(get("/api/listings")
                        .param("location", "15213"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.totalElements").value(1));

        ArgumentCaptor<ListingFilter> filterCaptor = ArgumentCaptor.forClass(ListingFilter.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        verify(listingService).getListings(filterCaptor.capture(), pageableCaptor.capture());

        ListingFilter filter = filterCaptor.getValue();
        Pageable pageable = pageableCaptor.getValue();

        assertThat(filter.location()).isEqualTo("15213");
        assertThat(filter.minPrice()).isNull();
        assertThat(filter.maxPrice()).isNull();
        assertThat(filter.minBeds()).isNull();
        assertThat(filter.maxSqft()).isNull();
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(20);
        assertThat(pageable.getSort()).isEqualTo(Sort.by(ASC, "price"));

        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldUseDefaultSuggestionLimitWhenLimitIsOmitted() throws Exception {
        List<SearchSuggestionDTO> suggestions = List.of(
                new SearchSuggestionDTO("zip", "15213", null, "15213")
        );

        given(suggestionService.getSuggestions("152", 5)).willReturn(suggestions);

        mockMvc.perform(get("/api/listings/suggestions")
                        .param("q", "152"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("zip"))
                .andExpect(jsonPath("$[0].label").value("15213"))
                .andExpect(jsonPath("$[0].zipCode").value("15213"));

        verify(suggestionService).getSuggestions("152", 5);

        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldPassExplicitSuggestionLimitToService() throws Exception {
        List<SearchSuggestionDTO> suggestions = List.of(
                new SearchSuggestionDTO("address", "1111 Forbes Ave", 10L, "15213")
        );

        given(suggestionService.getSuggestions("for", 3)).willReturn(suggestions);

        mockMvc.perform(get("/api/listings/suggestions")
                        .param("q", "for")
                        .param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("address"))
                .andExpect(jsonPath("$[0].listingId").value(10));

        verify(suggestionService).getSuggestions("for", 3);
        verifyNoMoreInteractions(listingService);
    }

    @Test
    void shouldReturnBadRequestWhenSuggestionQueryIsMissing() throws Exception {
        mockMvc.perform(get("/api/listings/suggestions"))
                .andExpect(status().isBadRequest());
    }

    private ListingDTO listingDto() {
        return ListingDTO.builder()
                .id(1L)
                .address("30 Pitt St")
                .zipCode("15213")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .energyStarScore(75)
                .listingUrl("http://example.com")
                .photoUrls(List.of("url1.jpg", "url2.jpg"))
                .build();
    }
}
