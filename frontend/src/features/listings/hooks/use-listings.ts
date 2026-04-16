import { useCallback, useEffect, useState } from "react";
import { getListings } from "@/features/listings/api";
import type { Listing, ListingFilters } from "@/features/listings/types";

type UseListingsParams = {
  page: number;
  size: number;
  filters?: ListingFilters;
};

type UseListingsResult = {
  listings: Listing[];
  totalPages: number;
  totalElements: number;
  page: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useListings({
  page,
  size,
  filters,
}: UseListingsParams): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getListings({
        page,
        size,
        filters,
      });
      setListings(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setError("Failed to load listings");
      setListings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  return {
    listings,
    totalPages,
    totalElements,
    page,
    loading,
    error,
    refetch: fetchListings,
  };
}
