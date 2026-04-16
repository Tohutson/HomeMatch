import { API_BASE } from "@/lib/env";
import type { SearchSuggestion } from "./types";

type SuggestionApiResponse = Array<Record<string, unknown>>;

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeSuggestion(
  suggestion: Record<string, unknown>
): SearchSuggestion | null {
  const explicitType = toStringValue(suggestion.type)?.toLowerCase();
  const listingId = toNumberValue(suggestion.listingId);
  const address =
    toStringValue(suggestion.address) ??
    toStringValue(suggestion.value) ??
    toStringValue(suggestion.label);
  const zipCode =
    toStringValue(suggestion.zipCode) ??
    toStringValue(suggestion.zip) ??
    toStringValue(suggestion.value);

  if ((explicitType === "address" || (listingId !== undefined && address)) && listingId !== undefined && address) {
    return {
      type: "address",
      value: address,
      listingId,
      zipCode,
    };
  }

  if (
    zipCode &&
    (
      explicitType === "zip" ||
      explicitType === "zipcode" ||
      listingId === undefined
    )
  ) {
    return {
      type: "zip",
      value: zipCode,
    };
  }

  return null;
}

export async function getSearchSuggestions(
  query: string,
  limit = 5,
  signal?: AbortSignal
): Promise<SearchSuggestion[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const searchParams = new URLSearchParams({
    q: trimmedQuery,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE}/api/listings/suggestions?${searchParams}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch suggestions");
  }

  const data = (await response.json()) as SuggestionApiResponse;

  return data
    .map(normalizeSuggestion)
    .filter((suggestion): suggestion is SearchSuggestion => suggestion !== null);
}
