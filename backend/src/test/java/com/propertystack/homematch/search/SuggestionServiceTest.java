package com.propertystack.homematch.search;

import com.propertystack.homematch.listing.ListingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private SuggestionService suggestionService;

    @Test
    @DisplayName("returns empty list when query is blank")
    void getSuggestions_blankQuery_returnsEmptyList() {
        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("   ", 5);

        assertThat(result).isEmpty();
        verifyNoInteractions(listingRepository);
    }

    @Test
    @DisplayName("maps address and zip suggestions and applies overall limit")
    void getSuggestions_mapsResultsAndAppliesLimit() {
        AddressSuggestionProjection address1 = projection(1L, "1111 Forbes Ave", "15213");
        AddressSuggestionProjection address2 = projection(2L, "1200 Forbes Ave", "15213");

        given(listingRepository.findAddressSuggestions("for"))
                .willReturn(List.of(address1, address2));
        given(listingRepository.findZipSuggestions("for"))
                .willReturn(List.of("15213"));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("for", 2);

        assertThat(result).hasSize(2);

        assertThat(result.get(0)).isEqualTo(
                new SearchSuggestionDTO("address", "1111 Forbes Ave", 1L, "15213")
        );
        assertThat(result.get(1)).isEqualTo(
                new SearchSuggestionDTO("address", "1200 Forbes Ave", 2L, "15213")
        );
    }

    @Test
    @DisplayName("trims query before calling repository methods")
    void getSuggestions_trimsQuery() {
        given(listingRepository.findAddressSuggestions("152"))
                .willReturn(List.of());
        given(listingRepository.findZipSuggestions("152"))
                .willReturn(List.of("15213"));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions(" 152 ", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("zip", "15213", null, "15213")
        );
    }

    @Test
    @DisplayName("returns both address and zip suggestions when under limit")
    void getSuggestions_returnsCombinedSuggestions() {
        AddressSuggestionProjection address = projection(10L, "5000 Centre Ave", "15213");

        given(listingRepository.findAddressSuggestions("15"))
                .willReturn(List.of(address));
        given(listingRepository.findZipSuggestions("15"))
                .willReturn(List.of("15213", "15217"));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("15", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("address", "5000 Centre Ave", 10L, "15213"),
                new SearchSuggestionDTO("zip", "15213", null, "15213"),
                new SearchSuggestionDTO("zip", "15217", null, "15217")
        );
    }

    private AddressSuggestionProjection projection(Long id, String address, String zipCode) {
        return new AddressSuggestionProjection() {
            @Override
            public Long getId() {
                return id;
            }

            @Override
            public String getAddress() {
                return address;
            }

            @Override
            public String getZipCode() {
                return zipCode;
            }
        };
    }
}