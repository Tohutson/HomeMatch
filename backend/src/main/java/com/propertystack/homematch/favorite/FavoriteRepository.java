package com.propertystack.homematch.favorite;

import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserOrderByCreatedAtDesc(User user);

    Optional<Favorite> findTopByUserOrderByCreatedAtDesc(User user);

    Optional<Favorite> findByUserAndListing(User user, Listing listing);

    boolean existsByUserAndListing(User user, Listing listing);

    void deleteByUserAndListing(User user, Listing listing);
}
