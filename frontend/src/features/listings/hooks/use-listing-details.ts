import { useCallback, useEffect, useState } from "react";
import type { Listing } from "@/features/listings/types";

import { API_BASE } from "@/lib/env";

type UseListingDetailsParams = {
  id: string | number | null | undefined;
};

type UseListingDetailsResult = {
  listing: Listing | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => Promise<void>;
};

export function useListingDetails({
  id,
}: UseListingDetailsParams): UseListingDetailsResult {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!id) {
      setListing(null);
      setNotFound(false);
      setError("Missing listing id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const res = await fetch(`${API_BASE}/api/listings/${id}`);

      if (res.status === 404) {
        setListing(null);
        setNotFound(true);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch listing");
      }

      const data: Listing = await res.json();
      setListing(data);
    } catch (err) {
      console.error("Failed to fetch listing:", err);
      setListing(null);
      setNotFound(false);
      setError(err instanceof Error ? err.message : "Failed to fetch listing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    listing,
    loading,
    error,
    notFound,
    refetch,
  };
}
