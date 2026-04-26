import { API_BASE } from "@/lib/env";
import type { Listing, ListingFilters, ListingSortOption, ListingsResponse } from "./types";

type GetListingsParams = {
  page?: number;
  size?: number;
  filters?: ListingFilters;
  sort?: ListingSortOption | null;
  signal?: AbortSignal;
};

export function buildListingsQuery(params: GetListingsParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 12));

  if (params.sort) {
    searchParams.set("sortOption", params.sort);
  }

  const filters = params.filters;

  if (filters?.minPrice !== undefined) {
    searchParams.set("minPrice", String(filters.minPrice));
  }
  if (filters?.maxPrice !== undefined) {
    searchParams.set("maxPrice", String(filters.maxPrice));
  }
  if (filters?.minBeds !== undefined) {
    searchParams.set("minBeds", String(filters.minBeds));
  }
  if (filters?.minBaths !== undefined) {
    searchParams.set("minBaths", String(filters.minBaths));
  }
  if (filters?.minSqft !== undefined) {
    searchParams.set("minSqft", String(filters.minSqft));
  }
  if (filters?.maxSqft !== undefined) {
    searchParams.set("maxSqft", String(filters.maxSqft));
  }
  if (filters?.minEnergyStarScore !== undefined) {
    searchParams.set("minEnergyStarScore", String(filters.minEnergyStarScore));
  }
  if (filters?.location !== undefined) {
    searchParams.set("location", filters.location);
  }

  return searchParams.toString();
}

export async function getListings(
  params: GetListingsParams = {}
): Promise<ListingsResponse> {
  const query = buildListingsQuery(params);

  const res = await fetch(`${API_BASE}/api/listings?${query}`, {
    method: "GET",
    cache: "no-store",
    signal: params.signal,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch listings");
  }

  const data = (await res.json()) as ListingsResponse;

  return {
    content: data.content ?? [],
    totalPages: data.totalPages ?? 0,
    totalElements: data.totalElements,
    size: data.size,
    number: data.number,
  };
}

export async function getListingById(
  id: string | number,
  signal?: AbortSignal
): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch listing");
  }

  return (await res.json()) as Listing;
}

export async function getAvailableListingIds(
  listingIds: number[],
  signal?: AbortSignal
): Promise<number[]> {
  if (listingIds.length === 0) {
    return [];
  }

  const searchParams = new URLSearchParams();

  for (const listingId of listingIds) {
    searchParams.append("ids", String(listingId));
  }

  const response = await fetch(
    `${API_BASE}/api/listings/availability?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch listing availability");
  }

  return (await response.json()) as number[];
}
