package com.propertystack.homematch.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "properties")
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String address;
    private String zipCode;
    private Double price;
    private int bedrooms;
    private double bathrooms;
    private int squareFootage;
    private int yearBuilt;
    private char energyRating;
    private LocalDateTime createdAt;
}
