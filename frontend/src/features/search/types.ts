export type AddressSuggestion = {
  type: "address";
  value: string;
  listingId: number;
  zipCode?: string;
};

export type ZipSuggestion = {
  type: "zip";
  value: string;
};

export type SearchSuggestion = AddressSuggestion | ZipSuggestion;
