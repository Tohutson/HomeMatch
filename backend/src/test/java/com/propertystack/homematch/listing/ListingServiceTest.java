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
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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
        void getListings_shouldBuildSpecificationAndPassPageableToRepository() {
                ListingFilter filter = new ListingFilter(
                        "15213",
                        new BigDecimal("100000"),
                        new BigDecimal("500000"),
                        2,
                        2.0,
                        1000,
                        50
                );
                Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "price"));

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                        .thenReturn(Page.empty());

                listingService.getListings(filter, pageable);

                verify(listingRepository).findAll(specificationCaptor.capture(), pageableCaptor.capture());

                assertThat(specificationCaptor.getValue()).isNotNull();
                assertThat(pageableCaptor.getValue()).isEqualTo(pageable);
        }

        @Test
        void getListings_shouldReturnMappedDtoPageWhenRepositoryReturnsResults() {
                Listing listing = listing();
                ListingDTO dto = listingDto();

                ListingFilter filter = new ListingFilter(
                        "15213",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );
                Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "price"));

                when(listingRepository.findAll(any(Specification.class), eq(pageable)))
                        .thenReturn(new PageImpl<>(List.of(listing), pageable, 1));
                when(listingMapper.toDTO(listing)).thenReturn(dto);

                Page<ListingDTO> result = listingService.getListings(filter, pageable);

                assertThat(result.getContent()).containsExactly(dto);
                assertThat(result.getTotalElements()).isEqualTo(1);
                assertThat(result.getNumber()).isEqualTo(0);
                assertThat(result.getSize()).isEqualTo(20);

                verify(listingRepository).findAll(any(Specification.class), eq(pageable));
                verify(listingMapper).toDTO(listing);
        }

        @Test
        void getListings_shouldReturnEmptyPageWhenRepositoryReturnsNoResults() {
                ListingFilter filter = new ListingFilter(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );
                Pageable pageable = PageRequest.of(0, 20);

                when(listingRepository.findAll(any(Specification.class), eq(pageable)))
                        .thenReturn(Page.empty(pageable));

                Page<ListingDTO> result = listingService.getListings(filter, pageable);

                assertThat(result).isEmpty();
                assertThat(result.getTotalElements()).isZero();

                verify(listingRepository).findAll(any(Specification.class), eq(pageable));
                verifyNoInteractions(listingMapper);
        }

        @Test
        void getListings_shouldPreserveSortingWhenPassingPageableToRepository() {
                ListingFilter filter = new ListingFilter(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );
                Pageable pageable = PageRequest.of(
                        0,
                        20,
                        Sort.by(Sort.Direction.DESC, "price")
                );

                when(listingRepository.findAll(any(Specification.class), any(Pageable.class)))
                        .thenReturn(Page.empty());

                listingService.getListings(filter, pageable);

                verify(listingRepository).findAll(any(Specification.class), pageableCaptor.capture());

                Pageable capturedPageable = pageableCaptor.getValue();
                assertThat(capturedPageable.getSort().getOrderFor("price")).isNotNull();
                assertThat(capturedPageable.getSort().getOrderFor("price").isDescending()).isTrue();
        }

        @Test
        void getListingById_shouldReturnMappedDtoWhenListingExists() {
                Listing listing = listing();
                ListingDTO dto = listingDto();

                when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
                when(listingMapper.toDTO(listing)).thenReturn(dto);

                ListingDTO result = listingService.getListingById(1L);

                assertThat(result).isEqualTo(dto);

                verify(listingRepository).findById(1L);
                verify(listingMapper).toDTO(listing);
        }

        @Test
        void getListingById_shouldThrowWhenListingDoesNotExist() {
                when(listingRepository.findById(1L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> listingService.getListingById(1L))
                        .isInstanceOf(ListingNotFoundException.class)
                        .hasMessage("Listing not found: 1");

                verify(listingRepository).findById(1L);
                verifyNoInteractions(listingMapper);
        }

        private Listing listing() {
                return Listing.builder()
                        .id(1L)
                        .address("30 Pitt St")
                        .zipCode("15213")
                        .price(new BigDecimal("250000"))
                        .sqft(2250)
                        .beds(3)
                        .baths(1.5)
                        .listingUrl("http://example.com")
                        .photoUrls(List.of("url1.jpg", "url2.jpg"))
                        .energyStarScore(75)
                        .build();
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
                        .listingUrl("http://example.com")
                        .photoUrls(List.of("url1.jpg", "url2.jpg"))
                        .energyStarScore(75)
                        .build();
        }
}