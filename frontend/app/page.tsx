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

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8081/api/listings?page=0&size=12")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch listings");
        }
        return res.json();
      })
      .then((data) => {
        setListings(data.content || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      <h1 className="mb-6 text-3xl font-bold">HomeMatch Listings</h1>
  
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </main>
  );
}