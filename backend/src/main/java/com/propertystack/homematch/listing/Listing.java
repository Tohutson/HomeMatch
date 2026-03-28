package com.propertystack.homematch.listing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listings")
public class Listing {
    
    // JPA spec requires a no-arg constructor with protected or public access
    protected Listing() {
    }

    @Id
    private Integer id;

    @Column(nullable = false)
    private String address;

    private Integer price;

    private Integer sqft;

    private Integer beds;

    private Double baths;

    @Column(name = "energy_star_score")
    private Integer energyStarScore;

    @Column(name = "listing_url", columnDefinition = "text")
    private String listingUrl;

    @Column(name = "all_photo_urls", columnDefinition = "text")
    private String allPhotoUrls;

    public Integer getId() {
        return id;
    }

    public String getAddress() {
        return address;
    }

    public Integer getPrice() {
        return price;
    }

    public Integer getSqft() {
        return sqft;
    }

    public Integer getBeds() {
        return beds;
    }

    public Double getBaths() {
        return baths;
    }

    public Integer getEnergyStarScore() {
        return energyStarScore;
    }

    public String getListingUrl() {
        return listingUrl;
    }

    public String getAllPhotoUrls() {
        return allPhotoUrls;
    }
}
