import type { Listing } from "@/features/listings/types";

export type FavoriteRecord = {
  id: number;
  listing: Listing;
  createdAt: string;
};
