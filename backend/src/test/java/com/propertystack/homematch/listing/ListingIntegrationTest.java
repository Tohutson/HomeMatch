package com.propertystack.homematch.listing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ListingIntegrationTest {

        @Container
        static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

        @DynamicPropertySource
        static void configureProperties(DynamicPropertyRegistry registry) {
                registry.add("spring.datasource.url", postgres::getJdbcUrl);
                registry.add("spring.datasource.username", postgres::getUsername);
                registry.add("spring.datasource.password", postgres::getPassword);
        }

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ListingRepository listingRepository;

        @BeforeEach
        void setUp() {
                listingRepository.deleteAll();

                listingRepository.save(listing(
                                "30 Pitt St",
                                "250000",
                                2250,
                                3,
                                2.0,
                                68,
                                "http://example.com/1"));

                listingRepository.save(listing(
                                "40 Forbes Ave",
                                "525000",
                                3100,
                                4,
                                3.0,
                                84,
                                "http://example.com/2"));

                listingRepository.save(listing(
                                "12 Fifth Ave",
                                "180000",
                                1400,
                                2,
                                1.0,
                                42,
                                "http://example.com/3"));
        }

        @Test
        void shouldReturnFilteredPagedListings() throws Exception {
                mockMvc.perform(get("/api/listings")
                                .param("minPrice", "200000")
                                .param("minBeds", "3")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(2))
                                .andExpect(jsonPath("$.totalElements").value(2))
                                .andExpect(jsonPath("$.size").value(10))
                                .andExpect(jsonPath("$.number").value(0));
        }

        @Test
        void shouldReturnListingById() throws Exception {
                Listing saved = listingRepository.save(listing(
                                "500 Market St",
                                "300000",
                                2000,
                                3,
                                2.5,
                                77,
                                "http://example.com/4"));

                mockMvc.perform(get("/api/listings/{id}", saved.getId()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(saved.getId()))
                                .andExpect(jsonPath("$.address").value("500 Market St"))
                                .andExpect(jsonPath("$.price").value(300000))
                                .andExpect(jsonPath("$.beds").value(3))
                                .andExpect(jsonPath("$.baths").value(2.5))
                                .andExpect(jsonPath("$.energyStarScore").value(77));
        }

        @Test
        void shouldReturnNotFoundWhenListingDoesNotExist() throws Exception {
                mockMvc.perform(get("/api/listings/{id}", 999999L))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message").value("Listing not found: 999999"))
                                .andExpect(jsonPath("$.path").value("/api/listings/999999"));
                        }

        @Test
        void shouldFilterByMinEnergyStarScore() throws Exception {
                mockMvc.perform(get("/api/listings")
                                .param("minEnergyStarScore", "70")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(1))
                                .andExpect(jsonPath("$.totalElements").value(1))
                                .andExpect(jsonPath("$.content[0].address").value("40 Forbes Ave"))
                                .andExpect(jsonPath("$.content[0].energyStarScore").value(84));
        }

        @Test
        void shouldReturnListingsSortedByPriceDesc() throws Exception {
                mockMvc.perform(get("/api/listings")
                                .param("sortOption", "PRICE_DESC")
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(3))
                                .andExpect(jsonPath("$.content[0].address").value("40 Forbes Ave"))
                                .andExpect(jsonPath("$.content[1].address").value("30 Pitt St"))
                                .andExpect(jsonPath("$.content[2].address").value("12 Fifth Ave"));
        }

        private Listing listing(
                        String address,
                        String price,
                        int sqft,
                        int beds,
                        double baths,
                        int energyStarScore,
                        String listingUrl) {
                return Listing.builder()
                                .address(address)
                                .price(new BigDecimal(price))
                                .sqft(sqft)
                                .beds(beds)
                                .baths(baths)
                                .energyStarScore(energyStarScore)
                                .listingUrl(listingUrl)
                                .build();
        }
}