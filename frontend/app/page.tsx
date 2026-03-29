"use client";

import { useEffect, useState } from "react";
import ListingCard from "./components/ListingCard";

type Listing = {
  id: number;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  photoUrls?: string[];
};

type ListingsResponse = {
  content: Listing[];
  totalPages: number;
};

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentIndexWithinPage, setCurrentIndexWithinPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = 12;
  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:8081/api/listings?page=${currentPage}&size=${pageSize}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch listings");
        }
        return res.json();
      })
      .then((data: ListingsResponse) => {
        setListings(data.content || []);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentPage]);

  const handleNext = () => {
    if (currentIndexWithinPage < listings.length - 1) {
      setCurrentIndexWithinPage(currentIndexWithinPage + 1);
      return;
    }

    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setCurrentIndexWithinPage(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndexWithinPage > 0) {
      setCurrentIndexWithinPage(currentIndexWithinPage - 1);
      return;
    }

    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setCurrentIndexWithinPage(0);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
        <p>Loading listings...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
        <p>Error: {error}</p>
      </main>
    );
  }
  
  if (listings.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-3xl font-bold">HomeMatch Listings</h1>
        <p>No listings found.</p>
      </main>
    );
  }

  const currentListing = listings[currentIndexWithinPage];

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      <h1 className="mb-6 text-3xl font-bold">HomeMatch Listings</h1>

      <div className="mx-auto max-w-2xl">
        <ListingCard listing={currentListing} />

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 0 && currentIndexWithinPage === 0}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Previous
          </button>

          <p className="text-sm text-zinc-600">
            Page {currentPage + 1} of {Math.max(totalPages, 1)}
          </p>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1 && currentIndexWithinPage === listings.length - 1}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}