package com.propertystack.homematch.listing;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ListingRepository extends JpaRepository<Listing, Integer> {

    @Query("""
	    SELECT l
	    FROM Listing l
	    WHERE (:maxPrice IS NULL OR l.price <= :maxPrice)
	      AND (:minBeds IS NULL OR l.beds >= :minBeds)
	      AND (:minBaths IS NULL OR l.baths >= :minBaths)
	    """)
    List<Listing> findWithFilters(
	    @Param("maxPrice") Integer maxPrice,
	    @Param("minBeds") Integer minBeds,
	    @Param("minBaths") Double minBaths,
	    Pageable pageable);
}