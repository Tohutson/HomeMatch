export type Listing = {
  id: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  listingUrl?: string | null;
  photoUrls?: string[];
  energyStarScore?: number | null;
};

export type ListingsResponse = {
  content: Listing[];
  totalPages: number;
  totalElements?: number;
  size?: number;
  number?: number;
};

export type ListingFilters = {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minEnergyStarScore?: number;
};

export type DraftListingFilters = {
  location: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
  minEnergyStarScore: string;
};
