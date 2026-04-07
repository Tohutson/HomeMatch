export type Listing = {
  id: number;
  address?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  listingUrl?: string | null;
  photoUrls?: string[];
};

export type ListingsResponse = {
  content: Listing[];
  totalPages: number;
  totalElements?: number;
  size?: number;
  number?: number;
};

export type ListingFilters = {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
};
