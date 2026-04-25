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

export type ListingSortOption =
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "SIZE_ASC"
  | "SIZE_DESC"
  | "ENERGY_DESC";

export const LISTING_SORT_OPTIONS: Array<{
  value: ListingSortOption;
  label: string;
}> = [
  { value: "PRICE_ASC", label: "Price: Low to High" },
  { value: "PRICE_DESC", label: "Price: High to Low" },
  { value: "SIZE_ASC", label: "Size: Small to Large" },
  { value: "SIZE_DESC", label: "Size: Large to Small" },
  { value: "ENERGY_DESC", label: "Energy Score: High to Low" },
];