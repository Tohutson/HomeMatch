type Listing = {
    id: number;
    address?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    photoUrls?: string[];
  };
  
  type ListingCardProps = {
    listing: Listing;
  };
  
  export default function ListingCard({ listing }: ListingCardProps) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        {listing.photoUrls?.[0] ? (
          <img
            src={listing.photoUrls[0]}
            alt={listing.address || "Property image"}
            className="mb-4 h-48 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
            No Image Available
          </div>
        )}
  
        <h2 className="mb-2 text-lg font-semibold">
          {listing.address || "No address available"}
        </h2>
        <p><span className="font-medium">Price:</span> {listing.price ? `$${listing.price.toLocaleString()}` : "N/A"}</p>
        <p><span className="font-medium">Bedrooms:</span> {listing.bedrooms ?? "N/A"}</p>
        <p><span className="font-medium">Bathrooms:</span> {listing.bathrooms ?? "N/A"}</p>
        <p><span className="font-medium">Square Feet:</span> {listing.squareFootage ?? "N/A"}</p>
      </div>
    );
  }