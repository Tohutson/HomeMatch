package com.propertystack.homematch.listing.exception;

public class ListingNotFoundException extends RuntimeException {

    public ListingNotFoundException(Long listingId) {
        super("Listing not found: " + listingId);
    }
}