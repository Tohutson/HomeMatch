"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      router.push("/listings");
      return;
    }

    router.push(`/listings?location=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        placeholder="Search by address or ZIP"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border px-4 py-2"
      />
    </form>
  );
}
