import { useCallback, useEffect, useRef, useState } from "react";
import { getListings } from "@/features/listings/api";
import type { Listing, ListingFilters } from "@/features/listings/types";
import { isAbortError } from "@/lib/is-abort-error";

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
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const fetchListings = useCallback(async () => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const data = await getListings({
        page,
        size,
        filters,
        signal: controller.signal,
      });

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setListings(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      console.error("Failed to fetch listings:", err);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setError("Failed to load listings");
      setListings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, [page, size, filters]);

  useEffect(() => {
    void fetchListings();

    return () => {
      activeRequestRef.current?.abort();
    };
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
