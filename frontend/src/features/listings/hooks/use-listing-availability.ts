import { useEffect, useMemo, useRef, useState } from "react";
import { getAvailableListingIds } from "@/features/listings/api";
import { isAbortError } from "@/lib/is-abort-error";

type UseListingAvailabilityResult = {
  unavailableIds: Set<number>;
};

export function useListingAvailability(
  listingIds: number[]
): UseListingAvailabilityResult {
  const [availabilityById, setAvailabilityById] = useState<
    Record<number, boolean>
  >({});
  const requestIdRef = useRef(0);
  const uniqueListingIds = useMemo(
    () => Array.from(new Set(listingIds)).sort((a, b) => a - b),
    [listingIds]
  );
  const missingListingIds = useMemo(
    () =>
      uniqueListingIds.filter((listingId) => !(listingId in availabilityById)),
    [availabilityById, uniqueListingIds]
  );
  const missingIdsKey = useMemo(
    () => missingListingIds.join(","),
    [missingListingIds]
  );

  useEffect(() => {
    if (missingListingIds.length === 0) {
      return;
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void (async () => {
      try {
        const availableIds = await getAvailableListingIds(
          missingListingIds,
          controller.signal
        );

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        const availableIdSet = new Set(availableIds);

        setAvailabilityById((current) => {
          const next = { ...current };

          for (const listingId of missingListingIds) {
            next[listingId] = availableIdSet.has(listingId);
          }

          return next;
        });
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Failed to check listing availability:", error);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [missingIdsKey, missingListingIds]);

  const unavailableIds = useMemo(
    () =>
      new Set(
        uniqueListingIds.filter((listingId) => availabilityById[listingId] === false)
      ),
    [availabilityById, uniqueListingIds]
  );

  return { unavailableIds };
}
