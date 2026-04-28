package com.propertystack.homematch.search;

import com.propertystack.homematch.listing.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final ListingRepository listingRepository;

    public List<SearchSuggestionDTO> getSuggestions(String q, int limit) {
        String normalized = normalize(q);

        if (normalized.isBlank()) {
            return List.of();
        }

        List<SearchSuggestionDTO> suggestions = new ArrayList<>();

        suggestions.addAll(getAddressSuggestions(normalized));
        suggestions.addAll(getZipSuggestions(normalized));

        return suggestions.stream()
                .distinct()
                .sorted(searchSuggestionComparator(normalized))
                .limit(limit)
                .toList();
    }

    private List<SearchSuggestionDTO> getAddressSuggestions(String q) {
        return listingRepository.findAddressSuggestions(q).stream()
                .map(row -> new SearchSuggestionDTO(
                        "address",
                        row.getAddress(),
                        row.getId(),
                        null
                ))
                .toList();
    }

    private List<SearchSuggestionDTO> getZipSuggestions(String q) {
        if (!looksLikeZipPrefix(q)) {
            return List.of();
        }

        return listingRepository.findZipSuggestions(q).stream()
                .map(zip -> new SearchSuggestionDTO(
                        "zip",
                        zip,
                        null,
                        zip
                ))
                .toList();
    }

    private String normalize(String q) {
        return q == null ? "" : q.trim();
    }

    private boolean looksLikeZipPrefix(String q) {
        return q.chars().allMatch(Character::isDigit) && q.length() <= 5;
    }

    private Comparator<SearchSuggestionDTO> searchSuggestionComparator(String query) {
        return Comparator
                .comparingInt((SearchSuggestionDTO s) -> score(s, query))
                .thenComparing(SearchSuggestionDTO::getLabel);
    }

    private int score(SearchSuggestionDTO suggestion, String query) {
        String label = suggestion.getLabel().toLowerCase();
        String q = query.toLowerCase();

        if ("zip".equals(suggestion.getType())) {
            if (label.equals(q)) return 0;
            if (label.startsWith(q)) return 1;
            return 10;
        }

        if (label.equals(q)) return 2;
        if (label.startsWith(q)) return 3;
        if (label.contains(q)) return 4;

        return 10;
    }
}
