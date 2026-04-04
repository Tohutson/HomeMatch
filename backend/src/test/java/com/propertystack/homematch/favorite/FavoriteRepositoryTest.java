package com.propertystack.homematch.favorite;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FavoriteRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name",
                postgres::getDriverClassName);
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ListingRepository listingRepository;

    private User user;
    private Listing listing1;
    private Listing listing2;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        listingRepository.deleteAll();
        userRepository.deleteAll();

        user     = userRepository.save(User.builder().build());
        listing1 = listingRepository.save(listing("30 Pitt St", "250000"));
        listing2 = listingRepository.save(listing("40 Forbes Ave", "525000"));
    }

    @Test
    void findByUserOrderByCreatedAtDesc_shouldReturnFavoritesNewestFirst()
            throws InterruptedException {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        Thread.sleep(20);
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing2).build());

        List<Favorite> results =
                favoriteRepository.findByUserOrderByCreatedAtDesc(user);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getListing().getAddress())
                .isEqualTo("40 Forbes Ave");
        assertThat(results.get(1).getListing().getAddress())
                .isEqualTo("30 Pitt St");
    }

    @Test
    void findTopByUserOrderByCreatedAtDesc_shouldReturnMostRecentFavorite()
            throws InterruptedException {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        Thread.sleep(20);
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing2).build());

        Optional<Favorite> result =
                favoriteRepository.findTopByUserOrderByCreatedAtDesc(user);

        assertThat(result).isPresent();
        assertThat(result.get().getListing().getAddress())
                .isEqualTo("40 Forbes Ave");
    }

    @Test
    void findTopByUserOrderByCreatedAtDesc_shouldReturnEmptyWhenNoFavorites() {
        assertThat(favoriteRepository
                .findTopByUserOrderByCreatedAtDesc(user)).isEmpty();
    }

    @Test
    void existsByUserAndListing_shouldReturnTrueWhenFavoriteExists() {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing1)).isTrue();
    }

    @Test
    void existsByUserAndListing_shouldReturnFalseWhenFavoriteDoesNotExist() {
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing1)).isFalse();
    }

    @Test
    void findByUserAndListing_shouldReturnFavoriteWhenItExists() {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        assertThat(favoriteRepository
                .findByUserAndListing(user, listing1)).isPresent();
    }

    @Test
    void findByUserAndListing_shouldReturnEmptyWhenItDoesNotExist() {
        assertThat(favoriteRepository
                .findByUserAndListing(user, listing1)).isEmpty();
    }

    @Test
    void deleteByUserAndListing_shouldRemoveFavorite() {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        favoriteRepository.deleteByUserAndListing(user, listing1);
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing1)).isFalse();
    }

    @Test
    void deleteByUserAndListing_shouldOnlyRemoveMatchingFavorite() {
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing1).build());
        favoriteRepository.save(
                Favorite.builder().user(user).listing(listing2).build());

        favoriteRepository.deleteByUserAndListing(user, listing1);

        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing1)).isFalse();
        assertThat(favoriteRepository
                .existsByUserAndListing(user, listing2)).isTrue();
    }

    private Listing listing(String address, String price) {
        return Listing.builder()
                .address(address).price(new BigDecimal(price))
                .beds(3).baths(2.0).sqft(2000)
                .listingUrl("http://example.com/" +
                        address.replace(" ", "-"))
                .build();
    }
}
