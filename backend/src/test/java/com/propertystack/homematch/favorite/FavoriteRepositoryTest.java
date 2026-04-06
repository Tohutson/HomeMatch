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
    static PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine");

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
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    private User user;
    private User otherUser;
    private Listing listing1;
    private Listing listing2;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        listingRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder().build());
        otherUser = userRepository.save(User.builder().build());

        listing1 = listingRepository.save(listing("30 Pitt St", "250000"));
        listing2 = listingRepository.save(listing("40 Forbes Ave", "525000"));
    }

    @Test
    void findByUserIdOrderByCreatedAtDesc_shouldReturnFavoritesNewestFirst()
            throws InterruptedException {

        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing1)
                .build());

        Thread.sleep(20);

        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing2)
                .build());

        List<Favorite> results = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        assertThat(results).hasSize(2);
        assertThat(results)
                .extracting(f -> f.getListing().getId())
                .containsExactlyInAnyOrder(listing1.getId(), listing2.getId());
    }

    @Test
    void findByUserIdOrderByCreatedAtDesc_shouldReturnOnlyFavoritesForRequestedUser() {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing1)
                .build());

        favoriteRepository.save(Favorite.builder()
                .user(otherUser)
                .listing(listing2)
                .build());

        List<Favorite> results = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getUser().getId()).isEqualTo(user.getId());
        assertThat(results.get(0).getListing().getId()).isEqualTo(listing1.getId());
    }

    @Test
    void findByUserIdOrderByCreatedAtDesc_shouldReturnEmptyListWhenUserHasNoFavorites() {
        List<Favorite> results = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        assertThat(results).isEmpty();
    }

    @Test
    void findByUserIdAndListingId_shouldReturnFavoriteWhenItExists() {
        Favorite saved = favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing1)
                .build());

        Optional<Favorite> result =
                favoriteRepository.findByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(saved.getId());
        assertThat(result.get().getUser().getId()).isEqualTo(user.getId());
        assertThat(result.get().getListing().getId()).isEqualTo(listing1.getId());
    }

    @Test
    void findByUserIdAndListingId_shouldReturnEmptyWhenItDoesNotExist() {
        Optional<Favorite> result =
                favoriteRepository.findByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void findByUserIdAndListingId_shouldReturnEmptyWhenFavoriteExistsForDifferentUser() {
        favoriteRepository.save(Favorite.builder()
                .user(otherUser)
                .listing(listing1)
                .build());

        Optional<Favorite> result =
                favoriteRepository.findByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void existsByUserIdAndListingId_shouldReturnTrueWhenFavoriteExists() {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing1)
                .build());

        boolean exists = favoriteRepository.existsByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(exists).isTrue();
    }

    @Test
    void existsByUserIdAndListingId_shouldReturnFalseWhenFavoriteDoesNotExist() {
        boolean exists = favoriteRepository.existsByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(exists).isFalse();
    }

    @Test
    void existsByUserIdAndListingId_shouldReturnFalseWhenFavoriteExistsForDifferentListing() {
        favoriteRepository.save(Favorite.builder()
                .user(user)
                .listing(listing2)
                .build());

        boolean exists = favoriteRepository.existsByUserIdAndListingId(user.getId(), listing1.getId());

        assertThat(exists).isFalse();
    }

    private Listing listing(String address, String price) {
        return Listing.builder()
                .address(address)
                .price(new BigDecimal(price))
                .beds(3)
                .baths(2.0)
                .sqft(2000)
                .listingUrl("http://example.com/" + address.replace(" ", "-"))
                .build();
    }
}