package com.propertystack.homematch.model;

import java.math.BigDecimal;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Listing {

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
}