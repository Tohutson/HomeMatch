package com.propertystack.homematch.listing;

import com.propertystack.homematch.search.AddressSuggestionProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    @Query("""
        select l.id as id, l.address as address, l.zipCode as zipCode
        from Listing l
        where lower(l.address) like lower(concat(:query, '%'))
           or lower(l.address) like lower(concat('%', :query, '%'))
        order by
            case
                when lower(l.address) like lower(concat(:query, '%')) then 0
                else 1
            end,
            l.address asc
    """)
    List<AddressSuggestionProjection> findAddressSuggestions(@Param("query") String query);

    @Query("""
        select distinct l.zipCode
        from Listing l
        where l.zipCode like concat(:prefix, '%')
        order by l.zipCode asc
    """)
    List<String> findZipSuggestions(@Param("prefix") String prefix);
}