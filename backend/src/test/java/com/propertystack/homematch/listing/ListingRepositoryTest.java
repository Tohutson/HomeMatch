package com.propertystack.homematch.listing;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.propertystack.homematch.listing.query.ListingFilter;
import com.propertystack.homematch.listing.query.ListingSpecification;

import com.propertystack.homematch.search.AddressSuggestionProjection;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.springframework.data.domain.Sort;

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

        @Autowired
        private EntityManager entityManager;

        @Test
        void findById_shouldReturnListingWhenItExists() {
                Listing saved = listingRepository.save(buildListing(
                        "30 Pitt St",
                        "15213",
                        "250000",
                        3,
                        1.5,
                        2250,
                        50
                ));

                Optional<Listing> result = listingRepository.findById(saved.getId());

                assertThat(result).isPresent();
                assertThat(result.get().getAddress()).isEqualTo("30 Pitt St");
                assertThat(result.get().getZipCode()).isEqualTo("15213");
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
                        buildListing("30 Pitt St", "15213", "250000", 3, 1.5, 2250, 50),
                        buildListing("40 Oak Ave", "15217", "400000", 4, 2.5, 3000, 79)
                ));

                Page<Listing> result = listingRepository.findAll(
                        ListingSpecification.fromFilter(emptyFilter()),
                        PageRequest.of(0, 20)
                );

                assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        void findAll_shouldApplyAllFilterCriteria() {
                listingRepository.saveAll(List.of(
                        buildListing("Match", "15213", "350000", 3, 2.0, 1800, 60),
                        buildListing("Too Cheap", "15213", "200000", 3, 2.0, 1800, 60),
                        buildListing("Too Expensive", "15213", "450000", 3, 2.0, 1800, 60),
                        buildListing("Too Few Beds", "15213", "350000", 2, 2.0, 1800, 60),
                        buildListing("Too Few Baths", "15213", "350000", 3, 1.5, 1800, 60),
                        buildListing("Too Small", "15213", "350000", 3, 2.0, 1200, 60),
                        buildListing("Too Low Energy", "15213", "350000", 3, 2.0, 1800, 35)
                ));

                ListingFilter filter = new ListingFilter(
                        null,
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

                assertThat(result.getContent())
                        .extracting(Listing::getAddress)
                        .containsExactly("Match");
        }

        @Test
        void findAll_shouldRespectPaginationAndSorting() {
                listingRepository.saveAll(List.of(
                        buildListing("High", "15213", "300000", 2, 1.0, 1000, 40),
                        buildListing("Low", "15213", "100000", 2, 1.0, 1000, 40),
                        buildListing("Mid", "15213", "200000", 2, 1.0, 1000, 40)
                ));

                Page<Listing> result = listingRepository.findAll(
                        ListingSpecification.fromFilter(emptyFilter()),
                        PageRequest.of(0, 2, Sort.by(Sort.Direction.ASC, "price"))
                );

                assertThat(result.getContent())
                        .extracting(Listing::getAddress)
                        .containsExactly("Low", "Mid");
                assertThat(result.getTotalElements()).isEqualTo(3);
                assertThat(result.getTotalPages()).isEqualTo(2);
        }

        @Test
        void findAll_shouldFilterAndSortTogether() {
                listingRepository.saveAll(List.of(
                        buildListing("A", "15213", "300000", 3, 2.0, 1600, 60),
                        buildListing("B", "15213", "350000", 3, 2.0, 1700, 60),
                        buildListing("C", "15213", "200000", 2, 1.0, 1200, 40)
                ));

                ListingFilter filter = new ListingFilter(
                        null,
                        new BigDecimal("250000"),
                        null,
                        3,
                        null,
                        null,
                        null
                );

                Page<Listing> result = listingRepository.findAll(
                        ListingSpecification.fromFilter(filter),
                        PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "price"))
                );

                assertThat(result.getContent())
                        .extracting(Listing::getAddress)
                        .containsExactly("B", "A");
        }

        @Test
        @DisplayName("findAddressSuggestions returns prefix matches before contains matches and sorts alphabetically")
        void findAddressSuggestions_shouldPrioritizePrefixMatchesThenSortAlphabetically() {
                persistListing("Forbes Ave 200", "15213");
                persistListing("Alpha Forbes Ave", "15213");
                persistListing("Forbes Ave 100", "15213");

                entityManager.flush();
                entityManager.clear();

                List<AddressSuggestionProjection> results = listingRepository.findAddressSuggestions("forbes");

                assertThat(results)
                        .extracting(AddressSuggestionProjection::getAddress)
                        .containsExactly(
                                "Forbes Ave 100",
                                "Forbes Ave 200",
                                "Alpha Forbes Ave"
                        );
        }

        @Test
        void findAddressSuggestions_shouldBeCaseInsensitive() {
                persistListing("Forbes Ave", "15213");
                persistListing("fOrEsT Hills Dr", "15221");

                entityManager.flush();
                entityManager.clear();

                List<AddressSuggestionProjection> results = listingRepository.findAddressSuggestions("FoR");

                assertThat(results)
                        .extracting(AddressSuggestionProjection::getAddress)
                        .containsExactly("Forbes Ave", "fOrEsT Hills Dr");
        }

        @Test
        void findZipSuggestions_shouldReturnDistinctSortedMatchesForPrefix() {
                persistListing("111 A St", "15213");
                persistListing("222 B St", "15213");
                persistListing("333 C St", "15217");
                persistListing("444 D St", "15301");

                entityManager.flush();
                entityManager.clear();

                List<String> results = listingRepository.findZipSuggestions("152");

                assertThat(results).containsExactly("15213", "15217");
        }

        @Test
        void findAll_shouldMatchLocationByZipCodeWhenInputLooksLikeZip() {
                listingRepository.saveAll(List.of(
                        buildListing("111 Forbes Ave", "15213", "250000", 3, 2.0, 1500, 80),
                        buildListing("222 Fifth Ave", "15217", "250000", 3, 2.0, 1500, 80),
                        buildListing("333 Zip Test Rd", "1521A", "250000", 3, 2.0, 1500, 80)
                ));

                ListingFilter filter = new ListingFilter(
                        "15213",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );

                List<Listing> results = listingRepository.findAll(
                        ListingSpecification.fromFilter(filter),
                        Sort.by(Sort.Direction.ASC, "address")
                );

                assertThat(results)
                        .extracting(Listing::getZipCode)
                        .containsExactly("15213");
        }

        @Test
        void findAll_shouldMatchLocationByAddressFragmentWhenInputIsNotZip() {
                listingRepository.saveAll(List.of(
                        buildListing("111 Forbes Ave", "15213", "250000", 3, 2.0, 1500, 80),
                        buildListing("222 Fifth Ave", "15217", "250000", 3, 2.0, 1500, 80),
                        buildListing("333 forbes street", "15222", "250000", 3, 2.0, 1500, 80)
                ));

                ListingFilter filter = new ListingFilter(
                        "forbes",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );

                List<Listing> results = listingRepository.findAll(
                        ListingSpecification.fromFilter(filter),
                        Sort.by(Sort.Direction.ASC, "address")
                );

                assertThat(results)
                        .extracting(Listing::getAddress)
                        .containsExactly("111 Forbes Ave", "333 forbes street");
        }

        @Test
        void findAll_shouldIgnoreBlankLocation() {
                listingRepository.saveAll(List.of(
                        buildListing("111 Forbes Ave", "15213", "250000", 3, 2.0, 1500, 80),
                        buildListing("222 Fifth Ave", "15217", "250000", 3, 2.0, 1500, 80)
                ));

                ListingFilter filter = new ListingFilter(
                        "   ",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );

                List<Listing> results = listingRepository.findAll(
                        ListingSpecification.fromFilter(filter),
                        Sort.by(Sort.Direction.ASC, "address")
                );

                assertThat(results)
                        .extracting(Listing::getAddress)
                        .containsExactly("111 Forbes Ave", "222 Fifth Ave");
        }

        private ListingFilter emptyFilter() {
                return new ListingFilter(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );
        }

        private void persistListing(String address, String zipCode) {
                entityManager.persist(buildListing(address, zipCode, "250000", 3, 2.0, 1500, 80));
        }

        private Listing buildListing(
                String address,
                String zipCode,
                String price,
                int beds,
                double baths,
                int sqft,
                int energyStarScore
        ) {
                return Listing.builder()
                        .address(address)
                        .zipCode(zipCode)
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