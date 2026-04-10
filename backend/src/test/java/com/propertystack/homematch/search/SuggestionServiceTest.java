package com.propertystack.homematch.search;

import com.propertystack.homematch.listing.ListingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private SuggestionService suggestionService;

    @Test
    void getSuggestions_shouldReturnEmptyListWhenQueryIsBlank() {
        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("   ", 5);

        assertThat(result).isEmpty();
        verifyNoInteractions(listingRepository);
    }

    @Test
    void getSuggestions_shouldReturnOnlyAddressSuggestionsWhenQueryIsNotZipLike() {
        AddressSuggestionProjection address1 = projection(1L, "1111 Forbes Ave", "15213");
        AddressSuggestionProjection address2 = projection(2L, "1200 Forbes Ave", "15213");

        when(listingRepository.findAddressSuggestions("for"))
                .thenReturn(List.of(address1, address2));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("for", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("address", "1111 Forbes Ave", 1L, null),
                new SearchSuggestionDTO("address", "1200 Forbes Ave", 2L, null)
        );
    }

    @Test
    void getSuggestions_shouldTrimQueryBeforeSearching() {
        AddressSuggestionProjection address = projection(10L, "5000 Centre Ave", "15213");

        when(listingRepository.findAddressSuggestions("for"))
                .thenReturn(List.of(address));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("  for  ", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("address", "5000 Centre Ave", 10L, null)
        );
    }

    @Test
    void getSuggestions_shouldReturnZipSuggestionsBeforeAddressSuggestionsForZipLikeQuery() {
        AddressSuggestionProjection address = projection(10L, "5000 152 Street", "99999");

        when(listingRepository.findAddressSuggestions("15"))
                .thenReturn(List.of(address));
        when(listingRepository.findZipSuggestions("15"))
                .thenReturn(List.of("15213", "15217"));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("15", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("zip", "15213", null, "15213"),
                new SearchSuggestionDTO("zip", "15217", null, "15217"),
                new SearchSuggestionDTO("address", "5000 152 Street", 10L, null)
        );
    }

    @Test
    void getSuggestions_shouldApplyLimitAfterSorting() {
        AddressSuggestionProjection address1 = projection(1L, "1111 Forbes Ave", "15213");
        AddressSuggestionProjection address2 = projection(2L, "1200 Forbes Ave", "15213");

        when(listingRepository.findAddressSuggestions("for"))
                .thenReturn(List.of(address1, address2));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("for", 1);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("address", "1111 Forbes Ave", 1L, null)
        );
    }

    @Test
    void getSuggestions_shouldRemoveDuplicateSuggestions() {
        when(listingRepository.findAddressSuggestions("15213"))
                .thenReturn(List.of());
        when(listingRepository.findZipSuggestions("15213"))
                .thenReturn(List.of("15213", "15213"));

        List<SearchSuggestionDTO> result = suggestionService.getSuggestions("15213", 5);

        assertThat(result).containsExactly(
                new SearchSuggestionDTO("zip", "15213", null, "15213")
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