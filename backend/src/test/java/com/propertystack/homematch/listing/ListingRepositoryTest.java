package com.propertystack.homematch.listing;

import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.listing.query.ListingSpecification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ListingRepositoryTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);

        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired
    private ListingRepository listingRepository;

    @Test
    void findById_shouldReturnListingWhenItExists() {
        Listing saved = listingRepository.save(buildListing(
                "30 Pitt St",
                "250000",
                3,
                1.5,
                2250,
                50
        ));

        Optional<Listing> result = listingRepository.findById(saved.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getAddress()).isEqualTo("30 Pitt St");
        assertThat(result.get().getPrice()).isEqualByComparingTo("250000");
        assertThat(result.get().getEnergyStarScore()).isEqualTo(50);
    }

    @Test
    void findById_shouldReturnEmptyWhenListingDoesNotExist() {
        Optional<Listing> result = listingRepository.findById(999999L);

        assertThat(result).isEmpty();
    }

    @Test
    void findAll_shouldReturnAllListingsWhenFilterIsEmpty() {
        listingRepository.saveAll(List.of(
                buildListing("30 Pitt St", "250000", 3, 1.5, 2250, 50),
                buildListing("40 Oak Ave", "400000", 4, 2.5, 3000, 79)
        ));

        ListingFilter filter = new ListingFilter(null, null, null, null, null, null);

        Page<Listing> result = listingRepository.findAll(
                ListingSpecification.fromFilter(filter),
                PageRequest.of(0, 20)
        );

        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void findAll_shouldFilterByMinPrice() {
        listingRepository.saveAll(List.of(
                buildListing("30 Pitt St", "250000", 3, 1.5, 2250, 50),
                buildListing("40 Oak Ave", "500000", 4, 2.5, 3000, 79)
        ));

        ListingFilter filter = new ListingFilter(
                new BigDecimal("300000"),
                null,
                null,
                null,
                null,
                null
        );

        Page<Listing> result = listingRepository.findAll(
                ListingSpecification.fromFilter(filter),
                PageRequest.of(0, 20)
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getAddress()).isEqualTo("40 Oak Ave");
    }

    @Test
    void findAll_shouldFilterByMultipleCriteria() {
        listingRepository.saveAll(List.of(
                buildListing("Match", "350000", 3, 2.0, 1800, 60),
                buildListing("Too Cheap", "200000", 3, 2.0, 1800, 60),
                buildListing("Too Few Beds", "350000", 2, 2.0, 1800, 60),
                buildListing("Too Small", "350000", 3, 2.0, 1200, 60),
                buildListing("Too Low Energy Score", "350000", 3, 2.0, 1600, 35)
        ));

        ListingFilter filter = new ListingFilter(
                new BigDecimal("300000"),
                new BigDecimal("400000"),
                3,
                2.0,
                1500,
                50
        );

        Page<Listing> result = listingRepository.findAll(
                ListingSpecification.fromFilter(filter),
                PageRequest.of(0, 20)
        );

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getAddress()).isEqualTo("Match");
    }

    @Test
    void findAll_shouldRespectPagination() {
        listingRepository.saveAll(List.of(
                buildListing("A St", "100000", 2, 1.0, 1000, 40),
                buildListing("B St", "200000", 2, 1.0, 1000, 55),
                buildListing("C St", "300000", 2, 1.0, 1000, 70)
        ));

        ListingFilter filter = new ListingFilter(null, null, null, null, null, null);

        Page<Listing> result = listingRepository.findAll(
                ListingSpecification.fromFilter(filter),
                PageRequest.of(0, 2)
        );

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(3);
        assertThat(result.getTotalPages()).isEqualTo(2);
    }

    private Listing buildListing(
            String address,
            String price,
            int beds,
            double baths,
            int sqft,
            int energyStarScore
    ) {
        return Listing.builder()
                .address(address)
                .price(new BigDecimal(price))
                .beds(beds)
                .baths(baths)
                .sqft(sqft)
                .listingUrl("http://example.com/" + address.replace(" ", "-"))
                .photoUrls(List.of("photo1.jpg", "photo2.jpg"))
                .energyStarScore(energyStarScore)
                .build();
    }
}