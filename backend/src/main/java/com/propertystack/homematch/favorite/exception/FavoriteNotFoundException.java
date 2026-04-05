package com.propertystack.homematch.favorite.exception;

public class FavoriteNotFoundException extends RuntimeException {

    public FavoriteNotFoundException(Long userId, Long listingId) {
        super("Favorite not found for user " + userId + " and listing " + listingId);
    }
}