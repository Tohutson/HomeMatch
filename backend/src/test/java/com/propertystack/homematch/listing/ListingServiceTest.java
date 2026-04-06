package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.dto.ListingDTO;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.listing.query.ListingFilter;
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
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class ListingServiceTest {

        @Mock
        private ListingRepository listingRepository;

        @Mock
        private ListingMapper listingMapper;

        @InjectMocks
        private ListingService listingService;

        @Captor
        private ArgumentCaptor<Specification<Listing>> specificationCaptor;

        @Captor
        private ArgumentCaptor<Pageable> pageableCaptor;

        @Test
        void getListings_shouldPassSpecificationAndPageableToRepository() {
                ListingFilter filter = new ListingFilter(
                                new BigDecimal("100000"),
                                new BigDecimal("500000"),
                                2,
                                2.0,
                                1000,
                                50);
                Pageable pageable = PageRequest.of(0, 20);

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(Page.empty());

                listingService.getListings(filter, pageable);

                verify(listingRepository).findAll(specificationCaptor.capture(), pageableCaptor.capture());
                assertThat(specificationCaptor.getValue()).isNotNull();
                assertThat(pageableCaptor.getValue()).isEqualTo(pageable);
        }

        @Test
        void getListings_shouldMapRepositoryResultsToDtoPage() {
                Listing listing = Listing.builder()
                                .id(1L)
                                .address("30 Pitt St")
                                .price(new BigDecimal("250000"))
                                .sqft(2250)
                                .beds(3)
                                .baths(1.5)
                                .listingUrl("http://example.com")
                                .photoUrls(List.of("url1.jpg", "url2.jpg"))
                                .energyStarScore(75)
                                .build();

                ListingDTO dto = ListingDTO.builder()
                                .id(1L)
                                .address("30 Pitt St")
                                .price(new BigDecimal("250000"))
                                .sqft(2250)
                                .beds(3)
                                .baths(1.5)
                                .listingUrl("http://example.com")
                                .photoUrls(List.of("url1.jpg", "url2.jpg"))
                                .energyStarScore(75)
                                .build();

                ListingFilter filter = new ListingFilter(null, null, null, null, null, null);
                Pageable pageable = PageRequest.of(0, 20);

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of(listing)));
                when(listingMapper.toDTO(listing)).thenReturn(dto);

                Page<ListingDTO> result = listingService.getListings(filter, pageable);

                assertThat(result.getContent()).containsExactly(dto);

                verify(listingRepository).findAll(any(Specification.class), eq(pageable));
                verify(listingMapper).toDTO(listing);
        }

        @Test
        void getListings_shouldReturnEmptyPageWhenRepositoryReturnsNoResults() {
                ListingFilter filter = new ListingFilter(null, null, null, null, null, null);
                Pageable pageable = PageRequest.of(0, 20);

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(Page.empty());

                Page<ListingDTO> result = listingService.getListings(filter, pageable);

                assertThat(result).isEmpty();
                assertThat(result.getTotalElements()).isZero();

                verify(listingRepository).findAll(any(Specification.class), eq(pageable));
                verifyNoInteractions(listingMapper);
        }

        @Test
        void getListingById_shouldReturnMappedDtoWhenListingExists() {
                Listing listing = Listing.builder()
                        .id(1L)
                        .address("30 Pitt St")
                        .price(new BigDecimal("250000"))
                        .energyStarScore(75)
                        .build();

                ListingDTO dto = ListingDTO.builder()
                        .id(1L)
                        .address("30 Pitt St")
                        .price(new BigDecimal("250000"))
                        .energyStarScore(75)
                        .build();

                when(listingRepository.findById(1L)).thenReturn(java.util.Optional.of(listing));
                when(listingMapper.toDTO(listing)).thenReturn(dto);

                ListingDTO result = listingService.getListingById(1L);

                assertThat(result).isEqualTo(dto);

                verify(listingRepository).findById(1L);
                verify(listingMapper).toDTO(listing);
        }

        @Test
        void getListingById_shouldThrowWhenListingDoesNotExist() {
                when(listingRepository.findById(1L)).thenReturn(java.util.Optional.empty());

                assertThatThrownBy(() -> listingService.getListingById(1L))
                        .isInstanceOf(ListingNotFoundException.class)
                        .hasMessage("Listing not found: 1");

                verify(listingRepository).findById(1L);
                verifyNoInteractions(listingMapper);
        }

        @Test
        void getListings_shouldPassSortedPageableToRepository() {
                ListingFilter filter = new ListingFilter(null, null, null, null, null, null);
                Pageable pageable = PageRequest.of(0, 20, org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "price"));

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(Page.empty());

                listingService.getListings(filter, pageable);

                verify(listingRepository).findAll(specificationCaptor.capture(), pageableCaptor.capture());

                Pageable captured = pageableCaptor.getValue();
                assertThat(captured.getSort().getOrderFor("price")).isNotNull();
                assertThat(captured.getSort().getOrderFor("price").isDescending()).isTrue();
        }
}