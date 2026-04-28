import { useCallback, useEffect, useRef, useState } from "react";
import type { Listing } from "@/features/listings/types";
import { getListingById } from "@/features/listings/api";
import { isAbortError } from "@/lib/is-abort-error";

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
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    activeRequestRef.current?.abort();

    if (!id) {
      setListing(null);
      setNotFound(false);
      setError("Missing listing id");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const data = await getListingById(id, controller.signal);

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      if (!data) {
        setListing(null);
        setNotFound(true);
        return;
      }

      setListing(data);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      console.error("Failed to fetch listing:", err);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setListing(null);
      setNotFound(false);
      setError(err instanceof Error ? err.message : "Failed to fetch listing");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, [id]);

  useEffect(() => {
    void refetch();

    return () => {
      activeRequestRef.current?.abort();
    };
  }, [refetch]);

  return {
    listing,
    loading,
    error,
    notFound,
    refetch,
  };
}
