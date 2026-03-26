package com.propertystack.homematch.Listing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository repository;

    @InjectMocks
    private ListingService service;

    @Captor
    private ArgumentCaptor<Specification<Listing>> specCaptor;

    @Captor
    private ArgumentCaptor<Pageable> pageCaptor;

    @Test
    void shouldPassSpecificationAndPageableToRepository() {
        // given
        ListingFilter filter = new ListingFilter(
                new BigDecimal("100000"), new BigDecimal("500000"),
                2, 2.0, 1000
        );
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        // when
        service.getListings(filter, pageable);

        // then — verify the repo was called exactly once with a spec and the pageable
        verify(repository).findAll(specCaptor.capture(), pageCaptor.capture());
        // verify service built Specification
        assertThat(specCaptor.getValue()).isNotNull();
        // verify service passed the correct pagination object
        assertThat(pageCaptor.getValue()).isEqualTo(pageable);
    }

    @Test
    void shouldReturnMappedDTOPage() {
        // given
        Listing listing = Listing.builder()
                .id(1L)
                .address("30 Pitt St")
                .price(new BigDecimal("250000"))
                .sqft(2250)
                .beds(3)
                .baths(1.5)
                .listingUrl("http://example.com")
                .photoUrls(List.of("url1.jpg", "url2.jpg"))
                .build();

        PageImpl<Listing> pageFromRepo = new PageImpl<>(List.of(listing));
        ListingFilter filter = new ListingFilter(null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(pageFromRepo);

        // when
        Page<ListingDTO> result = service.getListings(filter, pageable);

        // then
        verify(repository).findAll(any(Specification.class), any(Pageable.class));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent()).isNotEmpty();
    }

    @Test
    void shouldReturnEmptyPage() {
        ListingFilter filter = new ListingFilter(null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        Page<ListingDTO> result = service.getListings(filter, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }
}
