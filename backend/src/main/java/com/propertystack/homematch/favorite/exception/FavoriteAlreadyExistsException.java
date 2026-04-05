package com.propertystack.homematch.favorite.exception;

public class FavoriteAlreadyExistsException extends RuntimeException {

    public FavoriteAlreadyExistsException(Long userId, Long listingId) {
        super("Listing " + listingId + " is already favorited for user " + userId);
    }
}