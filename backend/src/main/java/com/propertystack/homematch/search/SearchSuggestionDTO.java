package com.propertystack.homematch.search;

import lombok.Builder;
import lombok.Getter;

import java.util.Objects;

@Getter
@Builder
public class SearchSuggestionDTO {
    private String type;      // "address" or "zip"
    private String label;     // text shown in dropdown
    private Long listingId;   // only for address suggestions
    private String zipCode;   // only for zip suggestions

    public SearchSuggestionDTO(String type, String label, Long listingId, String zipCode) {
        this.type = type;
        this.label = label;
        this.listingId = listingId;
        this.zipCode = zipCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SearchSuggestionDTO that)) return false;
        return Objects.equals(type, that.type)
                && Objects.equals(label, that.label)
                && Objects.equals(listingId, that.listingId)
                && Objects.equals(zipCode, that.zipCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, label, listingId, zipCode);
    }
}