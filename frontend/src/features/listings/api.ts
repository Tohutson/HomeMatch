import { API_BASE } from "@/lib/env";
import type { ListingFilters, ListingsResponse } from "./types";

type GetListingsParams = {
  page?: number;
  size?: number;
  filters?: ListingFilters;
};

function buildListingsQuery(params: GetListingsParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 12));

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

  return searchParams.toString();
}

export async function getListings(
  params: GetListingsParams = {}
): Promise<ListingsResponse> {
  const query = buildListingsQuery(params);

  const res = await fetch(`${API_BASE}/api/listings?${query}`, {
    method: "GET",
    cache: "no-store",
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
