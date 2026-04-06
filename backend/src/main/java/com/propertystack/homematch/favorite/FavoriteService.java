package com.propertystack.homematch.favorite;

import com.propertystack.homematch.favorite.dto.FavoriteDTO;
import com.propertystack.homematch.favorite.exception.FavoriteAlreadyExistsException;
import com.propertystack.homematch.favorite.exception.FavoriteNotFoundException;
import com.propertystack.homematch.listing.Listing;
import com.propertystack.homematch.listing.ListingRepository;
import com.propertystack.homematch.listing.exception.ListingNotFoundException;
import com.propertystack.homematch.listing.mapper.ListingMapper;
import com.propertystack.homematch.user.User;
import com.propertystack.homematch.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            UserRepository userRepository,
            ListingRepository listingRepository,
            ListingMapper listingMapper
    ) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.listingMapper = listingMapper;
    }

    @Transactional
    public FavoriteDTO addFavorite(Long userId, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ListingNotFoundException(listingId));

        if (favoriteRepository.existsByUserIdAndListingId(userId, listingId)) {
            throw new FavoriteAlreadyExistsException(userId, listingId);
        }

        User user = userRepository.getReferenceById(userId);
        Favorite saved = favoriteRepository.save(new Favorite(user, listing));
        return toDTO(saved);
    }

    @Transactional
    public void removeFavorite(Long userId, Long listingId) {
        Favorite favorite = favoriteRepository.findByUserIdAndListingId(userId, listingId)
                .orElseThrow(() -> new FavoriteNotFoundException(userId, listingId));

        favoriteRepository.delete(favorite);
    }

    public List<FavoriteDTO> getFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDTO)
                .toList();
    }

    private FavoriteDTO toDTO(Favorite favorite) {
        return FavoriteDTO.builder()
                .id(favorite.getId())
                .listing(listingMapper.toDTO(favorite.getListing()))
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}