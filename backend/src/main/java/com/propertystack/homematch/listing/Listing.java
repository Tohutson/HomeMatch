package com.propertystack.homematch.listing;

import java.math.BigDecimal;

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
    private Long id;

    @Column(nullable = false)
    private String address;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private BigDecimal sqft;

    private Integer beds;

    private BigDecimal baths;

    @Column(name = "listing_url", columnDefinition = "text")
    private String listingUrl;

    @Column(name = "photo_1", columnDefinition = "text")
    private String photo1;

    @Column(name = "photo_2", columnDefinition = "text")
    private String photo2;

    @Column(name = "photo_3", columnDefinition = "text")
    private String photo3;

    @Column(name = "photo_4", columnDefinition = "text")
    private String photo4;

    @Column(name = "photo_5", columnDefinition = "text")
    private String photo5;

    @Column(name = "all_photo_urls", columnDefinition = "text")
    private String allPhotoUrls;

    public Long getId() {
        return id;
    }

    public String getAddress() {
        return address;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getSqft() {
        return sqft;
    }

    public Integer getBeds() {
        return beds;
    }

    public BigDecimal getBaths() {
        return baths;
    }

    public String getListingUrl() {
        return listingUrl;
    }

    public String getPhoto1() {
        return photo1;
    }

    public String getPhoto2() {
        return photo2;
    }

    public String getPhoto3() {
        return photo3;
    }

    public String getPhoto4() {
        return photo4;
    }

    public String getPhoto5() {
        return photo5;
    }

    public String getAllPhotoUrls() {
        return allPhotoUrls;
    }
}
