package com.propertystack.homematch.Listing;

import com.propertystack.homematch.persistence.converter.PhotoUrlListConverter;
import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "sqft")
    private Integer sqft;

    @Column(name = "beds")
    private Integer beds;

    @Column(name = "baths")
    private Double baths;

    @Column(name = "listing_url", columnDefinition = "text")
    private String listingUrl;

    @Column(name = "all_photo_urls", columnDefinition = "text")
    @Convert(converter = PhotoUrlListConverter.class)
    private List<String> photoUrls;
}